// Offscreen document for automated card addition to Airbnb

interface VirtualCard {
    id: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    last4: string;
    brand: string;
}

interface AddCardRequest {
    card: VirtualCard;
    paymentTabId: number;
}

class OffscreenCardAdder {
    private iframe: HTMLIFrameElement | null = null;
    private currentCard: VirtualCard | null = null;
    private retryCount = 0;
    private maxRetries = 3;

    constructor() {
        this.setupMessageListener();
    }

    private setupMessageListener(): void {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                if (request.target !== 'offscreen') return;

                console.log('[Offscreen] Received message:', request.type);

                switch (request.type) {
                    case 'ADD_CARD_TO_AIRBNB':
                        this.handleAddCard(request.data)
                            .then(sendResponse)
                            .catch(error => {
                                console.error('[Offscreen] Error:', error);
                                sendResponse({ success: false, error: error.message });
                            });
                        return true; // Keep message channel open

                    default:
                        console.warn('[Offscreen] Unknown message type:', request.type);
                }
            }
        );
    }

    private async handleAddCard(data: AddCardRequest): Promise<{ success: boolean }> {
        this.currentCard = data.card;
        this.retryCount = 0;

        try {
            // Create invisible iframe for Airbnb payment method page
            const iframe = await this.createIframe();

            // Wait for iframe to load
            await this.waitForIframeLoad(iframe);

            // Navigate to payment methods page
            const paymentMethodsUrl = 'https://www.airbnb.com/account/payment-methods';
            iframe.src = paymentMethodsUrl;

            // Wait for page to fully load
            await this.waitForPageReady(iframe);

            // Click "Add payment method" button
            await this.clickAddPaymentMethod(iframe);

            // Fill card details
            await this.fillCardDetails(iframe);

            // Submit the form
            await this.submitCardForm(iframe);

            // Verify card was added
            const success = await this.verifyCardAdded(iframe);

            // Clean up
            this.cleanup();

            if (success) {
                // Notify background script
                chrome.runtime.sendMessage({
                    type: 'CARD_ADDED_TO_AIRBNB',
                    data: { success: true },
                });

                return { success: true };
            } else {
                throw new Error('Card verification failed');
            }

        } catch (error) {
            console.error('[Offscreen] Failed to add card:', error);
            this.cleanup();

            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`[Offscreen] Retrying... (${this.retryCount}/${this.maxRetries})`);
                return this.handleAddCard(data);
            }

            throw error;
        }
    }

    private async createIframe(): Promise<HTMLIFrameElement> {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                position: fixed;
                top: -9999px;
                left: -9999px;
                width: 1px;
                height: 1px;
                visibility: hidden;
            `;
            iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');

            document.body.appendChild(iframe);
            this.iframe = iframe;

            resolve(iframe);
        });
    }

    private async waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
        return new Promise((resolve) => {
            if (iframe.contentDocument?.readyState === 'complete') {
                resolve();
            } else {
                iframe.addEventListener('load', () => resolve(), { once: true });
            }
        });
    }

    private async waitForPageReady(iframe: HTMLIFrameElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Page load timeout'));
            }, 30000);

            const checkInterval = setInterval(() => {
                try {
                    const doc = iframe.contentDocument;
                    if (!doc) return;

                    // Check for Airbnb-specific elements that indicate page is ready
                    const isReady = doc.querySelector('[data-testid="account-menu"]') ||
                        doc.querySelector('[class*="payment"]') ||
                        doc.querySelector('button[aria-label*="Add"]');

                    if (isReady) {
                        clearInterval(checkInterval);
                        clearTimeout(timeout);
                        resolve();
                    }
                } catch (error) {
                    // Cross-origin access error, keep trying
                }
            }, 1000);
        });
    }

    private async clickAddPaymentMethod(iframe: HTMLIFrameElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Add payment method button not found'));
            }, 10000);

            const checkInterval = setInterval(() => {
                try {
                    const doc = iframe.contentDocument;
                    if (!doc) return;

                    // Try multiple selectors for the add payment button
                    const selectors = [
                        'button[aria-label*="Add payment"]',
                        'button:has-text("Add payment method")',
                        'a[href*="add-payment"]',
                        'button[data-testid*="add-payment"]',
                    ];

                    for (const selector of selectors) {
                        let button: HTMLElement | null = null;

                        if (selector.includes('has-text')) {
                            const buttons = doc.querySelectorAll('button');
                            button = Array.from(buttons).find(btn =>
                                btn.textContent?.toLowerCase().includes('add payment')
                            ) || null;
                        } else {
                            button = doc.querySelector(selector);
                        }

                        if (button) {
                            button.click();
                            clearInterval(checkInterval);
                            clearTimeout(timeout);
                            setTimeout(() => resolve(), 2000); // Wait for form to appear
                            return;
                        }
                    }
                } catch (error) {
                    console.error('[Offscreen] Error clicking add payment:', error);
                }
            }, 1000);
        });
    }

    private async fillCardDetails(iframe: HTMLIFrameElement): Promise<void> {
        if (!this.currentCard) throw new Error('No card data available');

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Card form not found'));
            }, 10000);

            const fillForm = () => {
                try {
                    const doc = iframe.contentDocument;
                    if (!doc) return false;

                    // Card number field selectors
                    const cardNumberSelectors = [
                        'input[name="cardNumber"]',
                        'input[id*="cardNumber"]',
                        'input[placeholder*="Card number"]',
                        'input[data-testid*="card-number"]',
                        'input[autocomplete="cc-number"]',
                    ];

                    let cardNumberField: HTMLInputElement | null = null;
                    for (const selector of cardNumberSelectors) {
                        cardNumberField = doc.querySelector(selector);
                        if (cardNumberField) break;
                    }

                    if (!cardNumberField) return false;

                    // Fill card number
                    this.setInputValue(cardNumberField, this.currentCard?.cardNumber || '');

                    // Find and fill expiry
                    const expirySelectors = [
                        'input[name="expiry"]',
                        'input[placeholder*="MM/YY"]',
                        'input[autocomplete="cc-exp"]',
                    ];

                    let expiryField: HTMLInputElement | null = null;
                    for (const selector of expirySelectors) {
                        expiryField = doc.querySelector(selector);
                        if (expiryField) break;
                    }

                    if (expiryField) {
                        const expiry = `${this.currentCard?.expiryMonth}/${this.currentCard?.expiryYear.slice(-2)}`;
                        this.setInputValue(expiryField, expiry);
                    } else {
                        // Try separate month/year fields
                        const monthField = doc.querySelector<HTMLInputElement>(
                            'input[name="expiryMonth"], select[name="expiryMonth"]'
                        );
                        const yearField = doc.querySelector<HTMLInputElement>(
                            'input[name="expiryYear"], select[name="expiryYear"]'
                        );

                        if (monthField) this.setInputValue(monthField, this.currentCard?.expiryMonth || '');
                        if (yearField) this.setInputValue(yearField, this.currentCard?.expiryYear || '');
                    }

                    // Fill CVV
                    const cvvSelectors = [
                        'input[name="cvv"]',
                        'input[name="cvc"]',
                        'input[placeholder*="CVV"]',
                        'input[placeholder*="CVC"]',
                        'input[autocomplete="cc-csc"]',
                    ];

                    let cvvField: HTMLInputElement | null = null;
                    for (const selector of cvvSelectors) {
                        cvvField = doc.querySelector(selector);
                        if (cvvField) break;
                    }

                    if (cvvField) {
                        this.setInputValue(cvvField, this.currentCard?.cvv || '');
                    }

                    // Add a card nickname (optional)
                    const nicknameField = doc.querySelector<HTMLInputElement>(
                        'input[name="nickname"], input[placeholder*="Nickname"]'
                    );
                    if (nicknameField) {
                        this.setInputValue(nicknameField, 'OnlyBNB Card');
                    }

                    return true;
                } catch (error) {
                    console.error('[Offscreen] Error filling form:', error);
                    return false;
                }
            };

            const checkInterval = setInterval(() => {
                if (fillForm()) {
                    clearInterval(checkInterval);
                    clearTimeout(timeout);
                    setTimeout(() => resolve(), 1000); // Give time for validation
                }
            }, 1000);
        });
    }

    private setInputValue(input: HTMLInputElement, value: string): void {
        // Trigger focus event
        input.focus();

        // Set value using multiple methods to ensure it works
        input.value = value;
        input.setAttribute('value', value);

        // Trigger input events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

        // Blur to trigger validation
        input.blur();
    }

    private async submitCardForm(iframe: HTMLIFrameElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Submit button not found'));
            }, 10000);

            const checkInterval = setInterval(() => {
                try {
                    const doc = iframe.contentDocument;
                    if (!doc) return;

                    // Find submit button
                    const submitSelectors = [
                        'button[type="submit"]',
                        'button:has-text("Add card")',
                        'button:has-text("Save")',
                        'button[data-testid*="submit"]',
                    ];

                    for (const selector of submitSelectors) {
                        let button: HTMLElement | null = null;

                        if (selector.includes('has-text')) {
                            const text = selector.match(/"([^"]+)"/)?.[1] || '';
                            const buttons = doc.querySelectorAll('button');
                            button = Array.from(buttons).find(btn =>
                                btn.textContent?.toLowerCase().includes(text.toLowerCase())
                            ) || null;
                        } else {
                            button = doc.querySelector(selector);
                        }

                        if (button && !button.hasAttribute('disabled')) {
                            button.click();
                            clearInterval(checkInterval);
                            clearTimeout(timeout);
                            setTimeout(() => resolve(), 3000); // Wait for submission
                            return;
                        }
                    }
                } catch (error) {
                    console.error('[Offscreen] Error submitting form:', error);
                }
            }, 1000);
        });
    }

    private async verifyCardAdded(iframe: HTMLIFrameElement): Promise<boolean> {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false); // Assume failure if we can't verify
            }, 10000);

            const checkInterval = setInterval(() => {
                try {
                    const doc = iframe.contentDocument;
                    if (!doc) return;

                    // Check for success indicators
                    const successIndicators = [
                        doc.querySelector('.success-message'),
                        doc.querySelector('[data-testid*="success"]'),
                        doc.body.textContent?.includes('successfully added'),
                        doc.body.textContent?.includes(this.currentCard?.last4 || ''),
                    ];

                    // Check for error indicators
                    const errorIndicators = [
                        doc.querySelector('.error-message'),
                        doc.querySelector('[role="alert"]'),
                        doc.body.textContent?.toLowerCase().includes('error'),
                        doc.body.textContent?.toLowerCase().includes('failed'),
                    ];

                    if (successIndicators.some(indicator => indicator)) {
                        clearInterval(checkInterval);
                        clearTimeout(timeout);
                        resolve(true);
                    } else if (errorIndicators.some(indicator => indicator)) {
                        clearInterval(checkInterval);
                        clearTimeout(timeout);
                        resolve(false);
                    }
                } catch (error) {
                    // Keep trying
                }
            }, 1000);
        });
    }

    private cleanup(): void {
        if (this.iframe) {
            this.iframe.remove();
            this.iframe = null;
        }
        this.currentCard = null;
    }
}

// Initialize the offscreen document
new OffscreenCardAdder();

// Log that offscreen document is ready
console.log('[Offscreen] Document initialized and ready');
