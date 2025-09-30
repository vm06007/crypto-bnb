// Shared types between extension and backend

export interface PaymentRequest {
    amount: string;
    currency: string;
    url: string;
    timestamp: number;
    bookingId?: string;
}

export interface VirtualCard {
    id: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    cardNumber?: string;
    cvv?: string;
    status: 'active' | 'inactive';
}

export interface Transaction {
    id: string;
    virtualCardId: string;
    txHash: string;
    bnbAmount: string;
    fiatAmount: string;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    walletAddress: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    timestamp: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface CreateVirtualCardRequest {
    payment: PaymentRequest;
    transaction: {
        txHash: string;
        amount: string;
        walletAddress: string;
    };
}

export interface CreateVirtualCardResponse {
    card: VirtualCard;
    expiresAt: Date;
}

export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    timestamp: Date;
    signature?: string;
}
