// Background service worker for OnlyBnB

interface PaymentRequest {
    amount: string;
    currency: string;
    url: string;
    timestamp: number;
    bookingId?: string;
}

interface VirtualCard {
    id: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
    cardNumber?: string;
    cvv?: string;
}

class OnlyBnBBackground {
    private currentPayment: PaymentRequest | null = null;
    private offscreenDocumentPath = 'offscreen.html';
    private backendUrl = 'http://localhost:3000'; // In production, update this to your backend URL

    constructor() {
        this.setupListeners();
    }

    private setupListeners(): void {
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                console.log('[Background] Received message:', request.type);

                switch (request.type) {
                    case 'INITIATE_BNB_PAYMENT':
                    case 'OPEN_PAYMENT_POPUP':
                        this.handlePaymentInitiation(request.data, sender.tab?.id);
                        sendResponse({ success: true });
                        break;

                    case 'CONNECT_WALLET_FROM_POPUP':
                        this.handleWalletConnectionFromPopup(sender.tab?.id);
                        sendResponse({ success: true });
                        break;

                    case 'PAYMENT_CONFIRMED':
                        this.handlePaymentConfirmed(request.data);
                        sendResponse({ success: true });
                        break;

                    case 'GET_PAYMENT_DATA':
                        sendResponse({ data: this.currentPayment });
                        break;

                    case 'CARD_CREATED':
                        this.handleCardCreated(request.data);
                        sendResponse({ success: true });
                        break;

                    case 'CARD_ADDED_TO_AIRBNB':
                        this.handleCardAddedToAirbnb(request.data);
                        sendResponse({ success: true });
                        break;

                    default:
                        console.warn('[Background] Unknown message type:', request.type);
                }

                return true; // Keep message channel open for async responses
            }
        );

        // Handle extension icon click
        chrome.action.onClicked.addListener((tab) => {
            if (tab.url?.includes('airbnb.com')) {
                chrome.tabs.sendMessage(tab.id!, { type: 'CHECK_CHECKOUT_PAGE' });
            }
        });
    }

    private async handlePaymentInitiation(
        paymentData: PaymentRequest,
        tabId?: number
    ): Promise<void> {
        this.currentPayment = paymentData;

        // Store payment data
        await chrome.storage.local.set({
            currentPayment: paymentData,
            paymentTabId: tabId,
        });

        // Open popup for user to complete payment
        const popup = await chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: 420,
            height: 600,
            left: 100,
            top: 100,
        });

        // Store popup window ID
        await chrome.storage.local.set({ popupWindowId: popup.id });
    }

    private async handleWalletConnectionFromPopup(tabId?: number): Promise<void> {
        // Get the stored payment tab ID
        const { paymentTabId } = await chrome.storage.local.get('paymentTabId');
        const targetTabId = tabId || paymentTabId;

        if (!targetTabId) {
            console.error('[Background] No tab ID available for wallet connection');
            return;
        }

        // Send message to content script to connect wallet
        chrome.tabs.sendMessage(targetTabId, {
            type: 'CONNECT_WALLET_REQUEST',
            data: {}
        }, (response) => {
            if (response?.success && response.address) {
                // Store wallet address
                chrome.storage.local.set({
                    connectedAddress: response.address,
                    walletConnected: true
                });

                // Notify popup
                chrome.runtime.sendMessage({
                    type: 'WALLET_CONNECTED',
                    data: { address: response.address }
                });
            }
        });
    }

    private async handlePaymentConfirmed(data: {
        txHash: string;
        amount: string;
        walletAddress: string;
    }): Promise<void> {
        console.log('[Background] Payment confirmed:', data);

        // Wait for sufficient confirmations before proceeding
        await this.waitForConfirmations(data.txHash);

        try {
            // Call backend to create virtual card
            const response = await fetch(`${this.backendUrl}/api/create-virtual-card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment: this.currentPayment,
                    transaction: data,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create virtual card: ${response.statusText}`);
            }

            const virtualCard = await response.json();
            console.log('[Background] Virtual card created:', virtualCard);

            // Store card details
            await chrome.storage.local.set({
                virtualCard: virtualCard,
                cardCreatedAt: Date.now(),
            });

            // Now add the card to Airbnb using offscreen document
            await this.addCardToAirbnb(virtualCard);

        } catch (error) {
            console.error('[Background] Error creating virtual card:', error);
            this.notifyError('Failed to create virtual card');

            // Still close the popup even if card creation fails
            const { popupWindowId } = await chrome.storage.local.get('popupWindowId');
            if (popupWindowId) {
                setTimeout(() => {
                    chrome.windows.remove(popupWindowId);
                }, 1500);
            }
        }
    }

    private async waitForConfirmations(txHash: string, requiredConfirmations: number = 3): Promise<void> {
        console.log('[Background] Waiting for confirmations:', txHash);

        return new Promise((resolve, reject) => {
            const checkConfirmations = async () => {
                try {
                    const response = await fetch(`${this.backendUrl}/api/transaction/${txHash}/confirmations`);

                    if (response.ok) {
                        const data = await response.json();
                        console.log('[Background] Confirmations:', data.confirmations);

                        if (data.confirmations >= requiredConfirmations) {
                            console.log('[Background] Transaction confirmed with', data.confirmations, 'confirmations');
                            resolve();
                            return;
                        }
                    }

                    // Check again in 15 seconds
                    setTimeout(checkConfirmations, 15000);

                } catch (error) {
                    console.error('[Background] Error checking confirmations:', error);
                    setTimeout(checkConfirmations, 15000);
                }
            };

            // Start checking immediately
            checkConfirmations();

            // Timeout after 10 minutes
            setTimeout(() => {
                reject(new Error('Timeout waiting for confirmations'));
            }, 600000);
        });
    }

    private async addCardToAirbnb(virtualCard: VirtualCard): Promise<void> {
        // Create offscreen document (will handle existing document automatically)
        await chrome.offscreen.createDocument({
            url: this.offscreenDocumentPath,
            reasons: ['DOM_SCRAPING' as chrome.offscreen.Reason],
            justification: 'Adding virtual card to Airbnb payment methods',
        });

        // Send card details to offscreen document
        const response = await chrome.runtime.sendMessage({
            type: 'ADD_CARD_TO_AIRBNB',
            target: 'offscreen',
            data: {
                card: virtualCard,
                paymentTabId: (await chrome.storage.local.get('paymentTabId')).paymentTabId,
            },
        });

        if (response?.success) {
            console.log('[Background] Card successfully added to Airbnb');
        } else {
            throw new Error('Failed to add card to Airbnb');
        }
    }

    private async handleCardCreated(data: { card: VirtualCard }): Promise<void> {
        console.log('[Background] Virtual card created successfully');

        // Close the popup window
        const { popupWindowId } = await chrome.storage.local.get('popupWindowId');
        if (popupWindowId) {
            chrome.windows.remove(popupWindowId);
        }

        // Start adding card to Airbnb
        await this.addCardToAirbnb(data.card);
    }

    private async handleCardAddedToAirbnb(data: { success: boolean }): Promise<void> {
        if (data.success) {
            console.log('[Background] Card added to Airbnb successfully');

            // Notify content script to reload and select the card
            const { paymentTabId } = await chrome.storage.local.get('paymentTabId');
            if (paymentTabId) {
                chrome.tabs.sendMessage(paymentTabId, {
                    type: 'PAYMENT_COMPLETE',
                    data: { success: true },
                });
            }

            // Clean up storage
            await chrome.storage.local.remove([
                'currentPayment',
                'virtualCard',
                'paymentTabId',
                'popupWindowId',
            ]);

            // Close offscreen document
            await chrome.offscreen.closeDocument();
        } else {
            this.notifyError('Failed to add card to Airbnb');
        }
    }

    private notifyError(message: string): void {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/icon128.png'),
            title: 'OnlyBnB Error',
            message: message,
            priority: 2,
        });
    }
}

// Initialize background service
new OnlyBnBBackground();

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
    console.log('[OnlyBnB] Extension installed');
});

// Periodic keepalive
setInterval(() => {
    chrome.storage.local.get(['keepAlive'], (result) => {
        chrome.storage.local.set({ keepAlive: Date.now() });
    });
}, 20000);
