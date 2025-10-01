## PayperPlane Backend (FastAPI)

FastAPI service that:
- Listens to `Funded` events from `PayperPlane.sol` via Web3 in a background thread
- Creates Lithic virtual cards per funding and persists state in SQLite
- Provides secured REST endpoints to create/query fundings and simulate payments

### Setup
1) From this folder:
```bash
cp .env.example .env  # if you have one, otherwise create .env (see below)
```
2) Create `.env` with at least:
```bash
BACKEND_API_KEY=changeme
DATABASE_URL=sqlite:///./payperplane.db
WEB3_PROVIDER_URI=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000  # zero address = listener no-op
LITHIC_API_KEY=your_lithic_sandbox_key
LITHIC_ENVIRONMENT=sandbox
POLL_INTERVAL_SECONDS=1
```

### Run
```bash
uv run uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

SQLite tables are created automatically on startup. If the schema changes (e.g., ID type), delete the DB file specified by `DATABASE_URL` and restart.

### Security
All routes require the header:
```
X-API-Key: <BACKEND_API_KEY>
```

### Endpoints
- POST `/fundings/generate` → `{ id: string }` (UUID-as-string)
- GET `/fundings/{id}` → funding event status, card info, and payment info
- POST `/fundings/{id}/simulate` → simulates auth + clearing on Lithic using stored card
- GET `/health` → basic status

### Quick examples
```bash
# generate
curl -X POST \
  -H 'X-API-Key: changeme' \
  http://127.0.0.1:8000/fundings/generate

# get info
curl -H 'X-API-Key: changeme' \
  http://127.0.0.1:8000/fundings/<ID>

# simulate
curl -X POST -H 'X-API-Key: changeme' \
  http://127.0.0.1:8000/fundings/<ID>/simulate
```

### Notes
- `currencyCode` is indexed in the Solidity event; the listener maps known hashes to plain codes. Extend `SUPPORTED_CURRENCY_CODES` in `src/app.py` as needed.
- Set `CONTRACT_ADDRESS` to the deployed address to enable real event consumption; zero address keeps the listener idle.
