from __future__ import annotations

import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import requests
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from lithic import Lithic
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlmodel import Field, Session, SQLModel, create_engine
from web3 import Web3
from hexbytes import HexBytes


# -----------------------------
# Settings & Configuration
# -----------------------------


class Settings(BaseSettings):
    # API key for securing routes
    api_key: str = "changeme"
    # SQLite database file (project root)
    database_url: str = "sqlite:///./payperplane.db"
    # Web3
    web3_provider_uri: str = "http://127.0.0.1:8545"
    contract_address: str = "0x0000000000000000000000000000000000000000"
    # Lithic
    lithic_api_key: str = ""
    lithic_environment: str = "sandbox"
    # Polling
    poll_interval_seconds: float = 1.0

    # Load from .env if present
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()


# -----------------------------
# Currency code decoding (indexed string workaround)
# -----------------------------

# If the contract indexes a string, the log contains keccak256(string) in the topic.
# We cannot reverse the hash, so we map known codes to their hashes for decoding.
SUPPORTED_CURRENCY_CODES = ["USD", "EUR", "GBP", "SGD"]
CURRENCY_HASH_TO_CODE: Dict[bytes, str] = {bytes(Web3.keccak(text=code)): code for code in SUPPORTED_CURRENCY_CODES}


# -----------------------------
# Security
# -----------------------------


api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(x_api_key: Optional[str] = Depends(api_key_header)) -> None:
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key")


# -----------------------------
# Database Models (SQLite via SQLModel)
# -----------------------------


class Funding(SQLModel, table=True):
    id: str = Field(primary_key=True, index=True)
    # Event info
    event_received: bool = Field(default=False, index=True)
    currency_code: Optional[str] = Field(default=None)
    fiat_amount: Optional[int] = Field(default=None, description="Fiat amount in minor units")
    tx_sender: Optional[str] = Field(default=None, index=True)
    # Card info
    card_token: Optional[str] = Field(default=None, index=True)
    card_last_four: Optional[str] = Field(default=None)
    card_exp_month: Optional[str] = Field(default=None)
    card_exp_year: Optional[str] = Field(default=None)
    card_state: Optional[str] = Field(default=None)
    # Sensitive (sandbox only; required for simulate)
    card_pan: Optional[str] = Field(default=None)
    card_cvv: Optional[str] = Field(default=None)
    # Payment info
    authorization_token: Optional[str] = Field(default=None)
    cleared: bool = Field(default=False)
    clearing_debug_id: Optional[str] = Field(default=None)
    # Audit
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# SQLite engine with proper thread settings for background listener
engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)


def get_session() -> Session:
    with Session(engine) as session:
        yield session


# -----------------------------
# Lithic Client Wrapper
# -----------------------------


class LithicService:
    def __init__(self, api_key: str, environment: str) -> None:
        self.environment = environment
        self.client = Lithic(api_key=api_key, environment=environment)

    def create_virtual_card(self, tx_sender: Optional[str]) -> Dict[str, Any]:
        card = self.client.cards.create(type="VIRTUAL", memo=tx_sender or "PayperPlane User")
        # Convert to dict for serialization
        return {
            "token": getattr(card, "token", None),
            "last_four": getattr(card, "last_four", None),
            "exp_month": getattr(card, "exp_month", None),
            "exp_year": getattr(card, "exp_year", None),
            "state": getattr(card, "state", None),
            # Sandbox provides these
            "pan": getattr(card, "pan", None),
            "cvv": getattr(card, "cvv", None),
        }

    def simulate_authorization(self, pan: str, amount_minor: int, descriptor: str, mcc: str,
                                merchant_currency: str = "USD") -> Dict[str, Any]:
        tx = self.client.transactions.simulate_authorization(
            amount=amount_minor,
            merchant_amount=amount_minor,
            descriptor=descriptor,
            merchant_currency=merchant_currency,
            mcc=mcc,
            pan=pan,
        )
        return {"token": getattr(tx, "token", None), "debugging_request_id": getattr(tx, "debugging_request_id", None)}

    def simulate_clearing(self, transaction_token: str, amount: int) -> Dict[str, Any]:
        url_clear = f"https://{self.environment}.lithic.com/v1/simulate/clearing"
        payload = {"amount": amount, "token": transaction_token}
        headers = {"accept": "application/json", "content-type": "application/json", "Authorization": settings.lithic_api_key}
        clear_resp = requests.post(url_clear, json=payload, headers=headers)
        clear_resp.raise_for_status()
        return clear_resp.json()


lithic_service = LithicService(api_key=settings.lithic_api_key, environment=settings.lithic_environment)


# -----------------------------
# Web3 Event Listener (Background Thread)
# -----------------------------


# Minimal ABI for the Funded event
FUNDED_EVENT_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "id", "type": "uint256"},
            {"indexed": True, "internalType": "uint256", "name": "amount", "type": "uint256"},
            {"indexed": True, "internalType": "string", "name": "currencyCode", "type": "string"},
        ],
        "name": "Funded",
        "type": "event",
    }
]


class FundedEventListener:
    def __init__(self, provider_uri: str, contract_address: str) -> None:
        self.web3 = Web3(Web3.HTTPProvider(provider_uri, request_kwargs={"timeout": 2}))
        self.contract_address = contract_address
        self.contract = self.web3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=FUNDED_EVENT_ABI)
        self.thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()
        self.last_block = 0

    def start(self) -> None:
        if self.thread and self.thread.is_alive():
            return
        # Avoid blocking on startup; determine latest block inside the thread
        self.last_block = self.web3.eth.block_number
        self.stop_event.clear()
        self.thread = threading.Thread(target=self._run, name="funded-listener", daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=5)

    def _run(self) -> None:
        # Skip if no real address configured (but do not block startup)
        if self.contract_address.lower() == "0x0000000000000000000000000000000000000000":
            # poll no-op to keep thread lightweight
            while not self.stop_event.is_set():
                time.sleep(settings.poll_interval_seconds)
            return
        while not self.stop_event.is_set():
            try:
                latest = self.web3.eth.block_number
                from_block = self.last_block + 1
                to_block = latest
                print(f"Checking for Funded events from_block: {from_block}, to_block: {to_block}")
                if from_block <= to_block:
                    events = self.contract.events.Funded().get_logs(from_block=from_block, to_block=to_block)
                    for ev in events:
                        print(f"Found Funded event: {ev}")
                        args = ev["args"]
                        raw_cc = args.get("currencyCode")
                        currency_value = None
                        if isinstance(raw_cc, (bytes, bytearray, HexBytes)):
                            # Indexed string appears as keccak256 hash; map known codes if configured
                            currency_value = CURRENCY_HASH_TO_CODE.get(bytes(raw_cc))
                        elif isinstance(raw_cc, str):
                            currency_value = raw_cc
                        # Load transaction to capture sender
                        try:
                            tx = self.web3.eth.get_transaction(ev["transactionHash"])  # type: ignore[index]
                            tx_sender = tx.get("from")
                        except Exception:
                            tx_sender = None
                            print(f"Error getting transaction: {ev['transactionHash']}")
                        self._handle_funded_event(
                            funding_id=int(args["id"]),
                            fiat_amount=int(args["amount"]),
                            currency_code=currency_value,
                            tx_sender=tx_sender,
                        )
                    self.last_block = to_block
            except Exception:
                # Keep thread alive; add logging in real app
                pass
            time.sleep(settings.poll_interval_seconds)

    def _handle_funded_event(self, funding_id: int, fiat_amount: int, currency_code: Optional[str], tx_sender: Optional[str]) -> None:
        # Upsert funding, then create card (sandbox) and save
        with Session(engine) as session:
            funding = session.get(Funding, str(funding_id))
            if funding is None:
                funding = Funding(id=str(funding_id))
                session.add(funding)

            funding.event_received = True
            funding.fiat_amount = fiat_amount
            funding.currency_code = currency_code
            if tx_sender:
                try:
                    funding.tx_sender = Web3.to_checksum_address(tx_sender)
                except Exception:
                    funding.tx_sender = tx_sender

            # Create lithic card if not already created
            if not funding.card_token:
                try:
                    card = lithic_service.create_virtual_card(funding.tx_sender)
                    funding.card_token = card.get("token")
                    funding.card_last_four = card.get("last_four")
                    funding.card_exp_month = card.get("exp_month")
                    funding.card_exp_year = card.get("exp_year")
                    funding.card_state = card.get("state")
                    funding.card_pan = card.get("pan")
                    funding.card_cvv = card.get("cvv")
                except Exception:
                    # card creation may be retried on next event or via manual trigger
                    pass

            funding.updated_at = datetime.now(timezone.utc)
            session.commit()


event_listener = FundedEventListener(provider_uri=settings.web3_provider_uri, contract_address=settings.contract_address)


# -----------------------------
# API Schemas
# -----------------------------


class GenerateFundingResponse(BaseModel):
    id: str


class CardInfo(BaseModel):
    token: Optional[str]
    last_four: Optional[str]
    exp_month: Optional[str]
    exp_year: Optional[str]
    state: Optional[str]


class PaymentInfo(BaseModel):
    authorization_token: Optional[str]
    cleared: bool
    clearing_debug_id: Optional[str]


class FundingInfoResponse(BaseModel):
    id: str
    event_received: bool
    currency_code: Optional[str]
    fiat_amount: Optional[int]
    card: Optional[CardInfo]
    payment: PaymentInfo


class SimulateRequest(BaseModel):
    descriptor: str = "AIRBNB"
    mcc: str = "7011"


class SimulateResponse(BaseModel):
    transaction_token: Optional[str]
    cleared: bool
    clearing_debug_id: Optional[str]


# -----------------------------
# FastAPI App & Routes
# -----------------------------


app = FastAPI(title="PayperPlane Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    SQLModel.metadata.create_all(engine)
    event_listener.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
    event_listener.stop()


@app.post("/fundings/generate", response_model=GenerateFundingResponse, dependencies=[Depends(verify_api_key)])
def generate_funding(session: Session = Depends(get_session)) -> GenerateFundingResponse:
    # Generate a UUID-based integer ID and persist a placeholder funding
    new_id = str(uuid.uuid4().int)  # store as string to avoid SQLite overflow
    funding = Funding(id=new_id)
    session.add(funding)
    session.commit()
    return GenerateFundingResponse(id=new_id)


@app.get("/fundings/{funding_id}", response_model=FundingInfoResponse, dependencies=[Depends(verify_api_key)])
def get_funding_info(funding_id: str, session: Session = Depends(get_session)) -> FundingInfoResponse:
    funding = session.get(Funding, funding_id)
    if not funding:
        raise HTTPException(status_code=404, detail="Funding not found")
    card = None
    if funding.card_token:
        card = CardInfo(
            token=funding.card_token,
            last_four=funding.card_last_four,
            exp_month=funding.card_exp_month,
            exp_year=funding.card_exp_year,
            state=funding.card_state,
        )
    payment = PaymentInfo(
        authorization_token=funding.authorization_token,
        cleared=funding.cleared,
        clearing_debug_id=funding.clearing_debug_id,
    )
    return FundingInfoResponse(
        id=funding.id,
        event_received=funding.event_received,
        currency_code=funding.currency_code,
        fiat_amount=funding.fiat_amount,
        card=card,
        payment=payment,
    )


@app.post("/fundings/{funding_id}/simulate", response_model=SimulateResponse, dependencies=[Depends(verify_api_key)])
def simulate_and_clear(
    funding_id: str,
    body: SimulateRequest,
    session: Session = Depends(get_session),
) -> SimulateResponse:
    funding = session.get(Funding, funding_id)
    if not funding:
        raise HTTPException(status_code=404, detail="Funding not found")
    if not funding.card_pan:
        raise HTTPException(status_code=400, detail="Card not available for this funding")

    amount = funding.fiat_amount
    try:
        auth = lithic_service.simulate_authorization(
            pan=funding.card_pan,
            amount_minor=amount,
            descriptor=body.descriptor,
            mcc=body.mcc,
            merchant_currency=funding.currency_code,
        )
        funding.authorization_token = auth.get("token")
        session.commit()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Authorization simulation failed: {exc}")

    if not funding.authorization_token:
        raise HTTPException(status_code=500, detail="Authorization token missing after simulation")

    try:
        cleared = lithic_service.simulate_clearing(funding.authorization_token, amount)
        funding.cleared = True
        funding.clearing_debug_id = cleared.get("debugging_request_id")
        funding.updated_at = datetime.now(timezone.utc)
        session.commit()
        return SimulateResponse(transaction_token=funding.authorization_token, cleared=True, clearing_debug_id=funding.clearing_debug_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Clearing simulation failed: {exc}")


@app.get("/health", dependencies=[Depends(verify_api_key)])
def health() -> Dict[str, str]:
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


