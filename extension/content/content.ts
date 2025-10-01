// Content script for OnlyBnB - Injects "Pay with BNB" button on Airbnb checkout
// See README.md for details about the new modular architecture.
// Using native window.ethereum API with proper error handling

// Extend Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

class OnlyBnBInjector {

    private observer: MutationObserver | null = null;
    private buttonInjected = false;
    private checkoutDetected = false;

    constructor() {
        this.init();
    }

    // ============================================================================
    // INITIALIZATION & PAGE DETECTION
    // ============================================================================

    private init(): void {

        // Inject wallet connector script into the page
        this.injectWalletConnector();

        // Add a visible test element to confirm the script is running
        this.showTestIndicator();

        // Start observing for checkout page
        this.observePageChanges();
        // Check if we're already on checkout
        this.checkForCheckoutPage();

        // Also try to inject toggle immediately if on booking page
        if (window.location.pathname.includes('/book/')) {
            setTimeout(() => {
                this.injectCryptoToggle();
            }, 1000);

            // Try again after 3 seconds in case elements load later
            setTimeout(() => {
                this.injectCryptoToggle();
            }, 3000);

            // Don't automatically replace the button - wait for toggle
        }

        // Also check periodically in case dynamic content loads
        setInterval(() => {
            if (!this.buttonInjected) {
                this.checkForCheckoutPage();
            }
            // Don't automatically check for pay button
        }, 2000);
    }

    private injectWalletConnector(): void {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject/wallet-connector.js');
        script.onload = () => {
        };
        (document.head || document.documentElement).appendChild(script);
    }

    private showTestIndicator(): void {
        const testElement = document.createElement('div');
        testElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #F0B90B;
            color: #000;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
        `;
        testElement.textContent = 'OnlyBnB Extension Loaded!';
        document.body.appendChild(testElement);

        // Remove after 3 seconds
        setTimeout(() => {
            testElement.remove();
        }, 3000);
    }

    private observePageChanges(): void {
        this.observer = new MutationObserver(() => {
            if (!this.checkoutDetected) {
                this.checkForCheckoutPage();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    private checkForCheckoutPage(): void {
        // First check URL pattern
        const isBookingUrl = window.location.pathname.includes('/book/');

        if (isBookingUrl) {
        }

        // Multiple selectors to handle different Airbnb checkout page structures
        const checkoutSelectors = [
            '[data-testid="book-it-default"]',
            '[data-testid="reservation-payment"]',
            '[data-testid="checkout-page"]',
            'button[type="submit"][data-testid*="reservation"]',
            'div[aria-label*="payment"]',
            'div[class*="payment-section"]',
            'div[class*="checkout"]',
            'h2:has-text("Confirm and pay")',
            'h1:has-text("Confirm and pay")',
            // More specific selectors
            'button:contains("Confirm and pay")',
            'h1:contains("Confirm and pay")',
            'h2:contains("Confirm and pay")',
        ];

        // If on booking URL, always consider it checkout
        let isCheckout = isBookingUrl;

        // Also check for specific elements
        if (!isCheckout) {
            isCheckout = checkoutSelectors.some(selector => {
                try {
                    if (selector.includes(':contains')) {
                        // Handle jQuery-style contains selector
                        const match = selector.match(/(.+):contains\("(.+)"\)/);
                        if (match) {
                            const [, elementSelector, text] = match;
                            const elements = document.querySelectorAll(elementSelector);
                            return Array.from(elements).some(el =>
                                el.textContent?.toLowerCase().includes(text.toLowerCase())
                            );
                        }
                    } else if (selector.includes('has-text')) {
                        // Handle has-text pseudo selector
                        const element = selector.split(':')[0];
                        const text = selector.match(/"([^"]+)"/)?.[1];
                        if (text) {
                            const elements = document.querySelectorAll(element);
                            return Array.from(elements).some(el =>
                                el.textContent?.toLowerCase().includes(text.toLowerCase())
                            );
                        }
                    } else {
                        return document.querySelector(selector) !== null;
                    }
                } catch {
                    return false;
                }
                return false;
            });
        }

        if (isCheckout && !this.buttonInjected) {
            console.log('[OnlyBnB] Checkout detected, injecting crypto toggle...');
            this.checkoutDetected = true;
            // Inject crypto toggle only - don't replace button until toggle is enabled
            this.injectCryptoToggle();
            this.buttonInjected = true;
        }
    }

    // ============================================================================
    // CRYPTO TOGGLE INJECTION
    // ============================================================================

    private injectCryptoToggle(): void {
        console.log('[OnlyBnB] Creating custom crypto toggle...');

        // Check if we already added the crypto toggle
        if (document.querySelector('.onlybnb-crypto-toggle') ||
            document.querySelector('[data-onlybnb-crypto-toggle="true"]')) {
            console.log('[OnlyBnB] Crypto toggle already exists');
            return;
        }

        // Try multiple selectors to find the work trip toggle
        const workTripSelectors = [
            'div[data-plugin-in-point-id="SWITCH_ROW_WORK_TRIP"]',
            'div:contains("Is this a work trip?")',
            'div:has-text("Is this a work trip?")',
            'div[class*="work-trip"]',
            'div[class*="work_trip"]'
        ];

        let workTripToggle = null;
        for (const selector of workTripSelectors) {
            try {
                if (selector.includes(':contains')) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        workTripToggle = Array.from(elements).find(el =>
                            el.textContent?.toLowerCase().includes(text.toLowerCase())
                        );
                    }
                } else if (selector.includes('has-text')) {
                    const element = selector.split(':')[0];
                    const text = selector.match(/"([^"]+)"/)?.[1];
                    if (text) {
                        const elements = document.querySelectorAll(element);
                        workTripToggle = Array.from(elements).find(el =>
                            el.textContent?.toLowerCase().includes(text.toLowerCase())
                        );
                    }
                } else {
                    workTripToggle = document.querySelector(selector);
                }

                if (workTripToggle) {
                    console.log('[OnlyBnB] Found work trip toggle with selector:', selector);
                    break;
                }
            } catch (e) {
                console.debug('[OnlyBnB] Error with selector:', selector, e);
            }
        }

        if (!workTripToggle) {
            console.log('[OnlyBnB] Work trip toggle not found with any selector');
            console.log('[OnlyBnB] Available elements with data-plugin-in-point-id:', document.querySelectorAll('[data-plugin-in-point-id]'));
            console.log('[OnlyBnB] Available elements containing "work trip":', document.querySelectorAll('*').length);

            // Try to find any element containing "work trip" text
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
                if (el.textContent?.toLowerCase().includes('work trip')) {
                    console.log('[OnlyBnB] Found element with "work trip" text:', el);
                    workTripToggle = el;
                    break;
                }
            }
        }

        if (!workTripToggle) {
            console.log('[OnlyBnB] Still no work trip toggle found, trying to inject at a different location...');
            // Try to inject after any toggle or switch element
            const anyToggle = document.querySelector('[role="switch"], [data-testid*="switch"], [class*="switch"]');
            if (anyToggle) {
                console.log('[OnlyBnB] Found alternative toggle element:', anyToggle);
                workTripToggle = anyToggle;
            } else {
                console.log('[OnlyBnB] No suitable injection point found, trying fallback injection...');
                this.injectCryptoToggleFallback();
                return;
            }
        }

        console.log('[OnlyBnB] Found work trip toggle, creating custom crypto toggle...', workTripToggle);

        // Create the crypto toggle container with same structure as work trip toggle
        const cryptoToggle = document.createElement('div');
        cryptoToggle.className = 'onlybnb-crypto-toggle';
        cryptoToggle.setAttribute('data-onlybnb-crypto-toggle', 'true');
        cryptoToggle.setAttribute('data-plugin-in-point-id', 'SWITCH_ROW_CRYPTO');
        cryptoToggle.setAttribute('data-section-id', 'SWITCH_ROW_CRYPTO');
        cryptoToggle.style.cssText = `
            padding-top: 32px;
            padding-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top-style: solid;
            border-top-color: lightgray;
            border-top-width: 1px;
        `;

        // Create the title element
        const titleDiv = document.createElement('div');
        titleDiv.className = 't41l3z9 atm_c8_9oan3l atm_g3_1dzntr8 atm_cs_18jqzaw dir dir-ltr';
        titleDiv.id = 'SWITCH_ROW_CRYPTO-title';
        titleDiv.textContent = 'Pay with crypto';
        titleDiv.style.cssText = `
            font-weight: 500;
            line-height: 1.5;
            font-size: 16px;
            color: #222222;
        `;

        // Create the toggle switch button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'onlybnb-crypto-switch';
        toggleButton.setAttribute('role', 'switch');
        toggleButton.setAttribute('aria-checked', 'false');
        toggleButton.setAttribute('aria-labelledby', 'SWITCH_ROW_CRYPTO-title');
        toggleButton.id = 'SWITCH_ROW_CRYPTO-switch';
        toggleButton.style.cssText = `
            width: 48px;
            height: 32px;
            background: #e0e0e0;
            border: none;
            border-radius: 48px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.3s ease;
            outline: none;
        `;

        // Create the toggle knob
        const toggleKnob = document.createElement('div');
        toggleKnob.style.cssText = `
            width: 28px;
            height: 28px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: transform 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        toggleButton.appendChild(toggleKnob);
        cryptoToggle.appendChild(titleDiv);
        cryptoToggle.appendChild(toggleButton);

        // Insert the crypto toggle after the work trip toggle
        workTripToggle.parentElement?.insertBefore(cryptoToggle, workTripToggle.nextSibling);

        // Set up toggle functionality
        this.setupToggleFunctionality(cryptoToggle);

        console.log('[OnlyBnB] Custom crypto toggle added successfully');
        this.showSuccessIndicator();
    }

    private injectCryptoToggleFallback(): void {
        console.log('[OnlyBnB] Using fallback injection method...');

        // Try to find a good place to inject the toggle
        const possibleInjectionPoints = [
            'div[class*="payment"]',
            'div[class*="checkout"]',
            'div[class*="booking"]',
            'div[aria-label*="payment"]',
            'div[data-testid*="payment"]',
            'div[data-testid*="checkout"]',
            'div[data-testid*="booking"]'
        ];

        let injectionPoint = null;
        for (const selector of possibleInjectionPoints) {
            const element = document.querySelector(selector);
            if (element) {
                console.log('[OnlyBnB] Found injection point with selector:', selector);
                injectionPoint = element;
                break;
            }
        }

        if (!injectionPoint) {
            console.log('[OnlyBnB] No injection point found, injecting at body');
            injectionPoint = document.body;
        }

        // Create a simple crypto toggle
        const cryptoToggle = document.createElement('div');
        cryptoToggle.className = 'onlybnb-crypto-toggle';
        cryptoToggle.setAttribute('data-onlybnb-crypto-toggle', 'true');
        cryptoToggle.style.cssText = `
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            position: relative;
            z-index: 1000;
        `;

        cryptoToggle.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; background: #F0B90B; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">B</div>
                <div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #222;">Pay with crypto</h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Secure BNB payment</p>
                </div>
            </div>
            <button id="onlybnb-crypto-toggle-button" style="
                width: 100%;
                background: #F0B90B;
                color: #000;
                border: none;
                border-radius: 6px;
                padding: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s ease;
            ">Connect Wallet</button>
        `;

        // Insert the toggle
        if (injectionPoint === document.body) {
            injectionPoint.appendChild(cryptoToggle);
        } else {
            injectionPoint.insertBefore(cryptoToggle, injectionPoint.firstChild);
        }

        // Set up the button functionality
        const toggleButton = cryptoToggle.querySelector('#onlybnb-crypto-toggle-button') as HTMLButtonElement;
        toggleButton.addEventListener('click', async () => {
            try {
                await this.connectWallet();
                console.log('[OnlyBnB] Wallet connected via fallback method');
                // Show connected state
                toggleButton.textContent = 'Wallet Connected ✓';
                toggleButton.style.background = '#4CAF50';
                toggleButton.style.color = 'white';
            } catch (error) {
                console.error('[OnlyBnB] Wallet connection failed:', error);
                toggleButton.textContent = 'Connection Failed';
                toggleButton.style.background = '#f44336';
                toggleButton.style.color = 'white';
                setTimeout(() => {
                    toggleButton.textContent = 'Connect Wallet';
                    toggleButton.style.background = '#F0B90B';
                    toggleButton.style.color = '#000';
                }, 3000);
            }
        });

        console.log('[OnlyBnB] Fallback crypto toggle added successfully');
        this.showSuccessIndicator();
    }

    private setupToggleFunctionality(cryptoToggle: HTMLElement): void {
        const toggleButton = cryptoToggle.querySelector('.onlybnb-crypto-switch') as HTMLButtonElement;
        const toggleKnob = cryptoToggle.querySelector('.onlybnb-crypto-switch > div') as HTMLElement;

        let isCryptoEnabled = false;
        let originalPaymentSection: HTMLElement | null = null;

        const updateToggle = async (enabled: boolean) => {
            isCryptoEnabled = enabled;

            if (enabled) {
                toggleButton.style.background = '#F0B90B';
                toggleKnob.style.transform = 'translateX(16px)';
                toggleButton.setAttribute('aria-checked', 'true');

                // Add tick mark inside the knob
                if (!toggleKnob.querySelector('.tick-mark')) {
                    const tickMark = document.createElement('div');
                    tickMark.className = 'tick-mark';
                    tickMark.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: #F0B90B;
                        font-size: 16px;
                        font-weight: bold;
                        line-height: 1;
                    `;
                    tickMark.innerHTML = '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 12px; width: 12px; fill: currentcolor;"><path d="m10.5 1.939 1.061 1.061-7.061 7.061-.53-.531-3-3-.531-.53 1.061-1.061 3 3 5.47-5.469z"></path></svg>';
                    toggleKnob.appendChild(tickMark);
                }

                // Replace the confirm and pay button
                this.replaceConfirmPayButton();

                // Hide quick-pay terms and conditions
                this.hideQuickPayTerms();

                // Ensure original button stays hidden
                this.ensureOriginalButtonHidden();
            } else {
                toggleButton.style.background = '#e0e0e0';
                toggleKnob.style.transform = 'translateX(0)';
                toggleButton.setAttribute('aria-checked', 'false');

                // Remove tick mark from the knob
                const tickMark = toggleKnob.querySelector('.tick-mark');
                if (tickMark) {
                    tickMark.remove();
                }

                // Keep the original button hidden - don't restore it
                // The original button should stay hidden when crypto mode is disabled
                // Only hide the crypto payment options
                this.hideCryptoPaymentOptions(originalPaymentSection as HTMLElement);

                // Show quick-pay terms and conditions
                this.showQuickPayTerms();
            }

            // Find the payment section
            if (!originalPaymentSection) {
                originalPaymentSection = this.findPaymentSection();
            }

            if (enabled && originalPaymentSection) {
                // Store original content if not already stored
                if (!originalPaymentSection.dataset.originalContent) {
                    originalPaymentSection.dataset.originalContent = originalPaymentSection.innerHTML;
                }
                await this.showCryptoPaymentOptions(originalPaymentSection);
            } else if (originalPaymentSection) {
                this.hideCryptoPaymentOptions(originalPaymentSection);
            }
        };

        // Add click handler to the toggle switch
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            updateToggle(!isCryptoEnabled);
        });
    }

    private findPaymentSection(): HTMLElement | null {
        const paymentSectionSelectors = [
            'div[aria-label*="Pay with"]',
            'div[class*="payment"]',
            'section:has(h2:contains("Pay with"))',
            'div:has(> div > h2:contains("Pay with"))',
            'div:has(button:contains("Mastercard"))',
            'div:has(select option[value*="Mastercard"])',
        ];

        for (const selector of paymentSectionSelectors) {
            try {
                if (selector.includes(':contains')) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        const found = Array.from(elements).find(el =>
                            el.textContent?.toLowerCase().includes(text.toLowerCase())
                        );
                        if (found) {
                            return found as HTMLElement;
                        }
                    }
                } else {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element as HTMLElement;
                    }
                }
            } catch (e) {
                console.debug('[OnlyBnB] Error with selector:', selector, e);
            }
        }
        return null;
    }

    private showSuccessIndicator(): void {
        const successElement = document.createElement('div');
        successElement.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
        `;
        successElement.textContent = 'Crypto Toggle Added!';
        document.body.appendChild(successElement);

        // Remove after 3 seconds
        setTimeout(() => {
            successElement.remove();
        }, 3000);
    }

    private hideQuickPayTerms(): void {
        console.log('[OnlyBnB] Hiding quick-pay terms and conditions...');

        // Find the quick-pay terms and conditions element
        const termsSelectors = [
            '#quick-pay-terms-and-conditions',
            '[id="quick-pay-terms-and-conditions"]',
            '[class*="quick-pay-terms-and-conditions"]',
            '[data-testid*="quick-pay-terms"]',
            '[class*="terms-and-conditions"]',
            'p:contains("terms and conditions")',
            'div:contains("terms and conditions")'
        ];

        for (const selector of termsSelectors) {
            try {
                if (selector.includes(':contains')) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        const found = Array.from(elements).find(el =>
                            el.textContent?.toLowerCase().includes(text.toLowerCase())
                        );
                        if (found) {
                            const element = found as HTMLElement;
                            element.style.display = 'none';
                            element.setAttribute('data-onlybnb-hidden', 'true');
                            console.log('[OnlyBnB] Hidden quick-pay terms:', element);
                        }
                    }
                } else {
                    const element = document.querySelector(selector) as HTMLElement;
                    if (element) {
                        element.style.display = 'none';
                        element.setAttribute('data-onlybnb-hidden', 'true');
                        console.log('[OnlyBnB] Hidden quick-pay terms:', element);
                    }
                }
            } catch (e) {
                console.debug('[OnlyBnB] Error with terms selector:', selector, e);
            }
        }
    }

    private showQuickPayTerms(): void {
        console.log('[OnlyBnB] Showing quick-pay terms and conditions...');

        // Find and show all elements that were hidden by our extension
        const hiddenElements = document.querySelectorAll('[data-onlybnb-hidden="true"]');
        hiddenElements.forEach(element => {
            const htmlElement = element as HTMLElement;
            htmlElement.style.display = '';
            htmlElement.removeAttribute('data-onlybnb-hidden');
            console.log('[OnlyBnB] Shown quick-pay terms:', htmlElement);
        });
    }

    private ensureOriginalButtonHidden(): void {
        if (this.originalConfirmPayButton) {
            console.log('[OnlyBnB] Ensuring original button stays hidden...');
            this.originalConfirmPayButton.style.display = 'none';
            this.originalConfirmPayButton.setAttribute('data-onlybnb-hidden', 'true');
        }
    }

    // ============================================================================
    // WALLET MANAGEMENT
    // ============================================================================

    private async checkWalletConnection(): Promise<boolean> {
        try {
            // Direct approach - use window.ethereum if available
            if (!window.ethereum) {
                console.log('[OnlyBnB] No window.ethereum found for connection check');
                return false;
            }

            console.log('[OnlyBnB] Using window.ethereum directly for connection check');

            // Check if already connected using eth_accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const isConnected = accounts && accounts.length > 0;

            console.log('[OnlyBnB] Wallet connection status:', isConnected);
            console.log('[OnlyBnB] Connected accounts:', accounts);
            return isConnected;
        } catch (error) {
            console.log('[OnlyBnB] Wallet connection check failed:', error);
            return false;
        }
    }

    private connectedAccount: string | null = null;

    private async connectWallet(): Promise<void> {
        console.log('[OnlyBnB] Attempting to connect wallet via custom events...');

        return new Promise((resolve, reject) => {
            // Set up one-time response listener
            const handleResponse = (event: any) => {
                console.log('[OnlyBnB] Received wallet response:', event.detail);
                window.removeEventListener('onlybnb-wallet-response', handleResponse);

                if (event.detail.success) {
                    console.log('[OnlyBnB] Wallet connected successfully!');
                    console.log('[OnlyBnB] Account:', event.detail.account);
                    console.log('[OnlyBnB] Chain ID:', event.detail.chainId);

                    // Store connected account
                    this.connectedAccount = event.detail.account;

                    // Switch to BSC if needed
                    if (event.detail.chainId !== '0x38') {
                        this.switchToBSCNetwork().then(() => resolve()).catch(reject);
                    } else {
                        resolve();
                    }
                } else {
                    console.error('[OnlyBnB] Wallet connection failed:', event.detail.error);
                    reject(new Error(event.detail.error));
                }
            };

            window.addEventListener('onlybnb-wallet-response', handleResponse);

            // Send connection request
            console.log('[OnlyBnB] Dispatching wallet connection request...');
            window.dispatchEvent(new CustomEvent('onlybnb-connect-wallet'));

            // Timeout after 30 seconds
            setTimeout(() => {
                window.removeEventListener('onlybnb-wallet-response', handleResponse);
                reject(new Error('Wallet connection timeout'));
            }, 30000);
        });
    }

    private async switchToBSCNetwork(): Promise<void> {
        console.log('[OnlyBnB] Attempting to switch to BSC network...');

        return new Promise((resolve, reject) => {
            // Set up one-time response listener
            const handleResponse = (event: any) => {
                console.log('[OnlyBnB] Received network switch response:', event.detail);
                window.removeEventListener('onlybnb-network-response', handleResponse);

                if (event.detail.success) {
                    console.log('[OnlyBnB] Network switch successful:', event.detail.message);
                    resolve();
                } else {
                    console.error('[OnlyBnB] Network switch failed:', event.detail.error);
                    // Don't reject, just resolve anyway - network switch is optional
                    resolve();
                }
            };

            window.addEventListener('onlybnb-network-response', handleResponse);

            // Send network switch request
            console.log('[OnlyBnB] Dispatching network switch request...');
            window.dispatchEvent(new CustomEvent('onlybnb-switch-network'));

            // Timeout after 10 seconds
            setTimeout(() => {
                window.removeEventListener('onlybnb-network-response', handleResponse);
                console.warn('[OnlyBnB] Network switch timeout - continuing anyway');
                resolve(); // Don't reject on timeout
            }, 10000);
        });
    }

    // ============================================================================
    // CONFIRM AND PAY BUTTON REPLACEMENT
    // ============================================================================

    public originalConfirmPayButton: HTMLElement | null = null;
    private cryptoPayButton: HTMLElement | null = null;
    private payButtonReplaced = false;

    private replaceConfirmPayButton(): void {
        // Don't replace if already done
        if (this.payButtonReplaced) {
            return;
        }

        // Find the Airbnb "Confirm and pay" button
        const confirmPaySelectors = [
            'button[type="submit"]:contains("Confirm and pay")',
            'button:contains("Confirm and pay")',
            'button[aria-label*="Confirm and pay"]',
            'button[data-testid*="confirm"]',
            'button[type="submit"][class*="primary"]',
            // More generic selectors
            'button[type="submit"]',
        ];

        let confirmButton: HTMLElement | null = null;

        // Try each selector
        for (const selector of confirmPaySelectors) {
            try {
                if (selector.includes(':contains')) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        confirmButton = Array.from(elements).find(el =>
                            el.textContent?.toLowerCase().includes(text.toLowerCase())
                        ) as HTMLElement;
                    }
                } else {
                    const elements = document.querySelectorAll(selector);
                    // Look for button with "Confirm and pay" text
                    confirmButton = Array.from(elements).find(el =>
                        el.textContent?.toLowerCase().includes('confirm and pay')
                    ) as HTMLElement;

                    // If not found, look for primary submit button
                    if (!confirmButton && elements.length > 0) {
                        confirmButton = elements[0] as HTMLElement;
                    }
                }

                if (confirmButton) {
                    console.log('[OnlyBnB] Found confirm button with selector:', selector);
                    break;
                }
            } catch (e) {
                console.debug('[OnlyBnB] Error with selector:', selector, e);
            }
        }

        if (!confirmButton) {
            console.log('[OnlyBnB] Confirm and pay button not found yet');
            return;
        }

        console.log('[OnlyBnB] Found Confirm and pay button, replacing...');

        // Store reference to original button
        this.originalConfirmPayButton = confirmButton;

        // Hide the original button
        confirmButton.style.display = 'none';
        confirmButton.setAttribute('data-onlybnb-hidden', 'true');

        this.payButtonReplaced = true;
        console.log('[OnlyBnB] Confirm and pay button replaced with crypto button');
    }

    // ============================================================================
    // CRYPTO PAYMENT UI
    // ============================================================================

    private async showCryptoPaymentOptions(paymentSection: HTMLElement): Promise<void> {
        // Store original content if not already stored
        if (!paymentSection.dataset.originalContent) {
            paymentSection.dataset.originalContent = paymentSection.innerHTML;
        }

        // Create crypto payment section
        const cryptoSection = document.createElement('div');
        cryptoSection.className = 'onlybnb-crypto-payment';
        cryptoSection.style.cssText = `
            background: white;
            border-radius: 8px;
        `;

        // Replace payment section content
        paymentSection.innerHTML = '';
        paymentSection.appendChild(cryptoSection);

        console.log('[OnlyBnB] Crypto payment options shown');
    }


    private hideCryptoPaymentOptions(paymentSection: HTMLElement): void {
        // Restore original content
        if (paymentSection.dataset.originalContent) {
            paymentSection.innerHTML = paymentSection.dataset.originalContent;
        }

        console.log('[OnlyBnB] Crypto payment options hidden, original payment section restored');
    }


    // ============================================================================
    // PRICE EXTRACTION AND CONVERSION
    // ============================================================================

    private async fetchBNBPrice(): Promise<{ usd: number; sgd: number }> {
        console.log('[OnlyBnB] Fetching BNB price...');

        return new Promise((resolve, reject) => {
            // Set up one-time response listener
            const handleResponse = (event: any) => {
                console.log('[OnlyBnB] Received BNB price response:', event.detail);
                window.removeEventListener('onlybnb-price-response', handleResponse);

                if (event.detail.success) {
                    resolve(event.detail.prices);
                } else {
                    console.error('[OnlyBnB] BNB price fetch failed, using fallback:', event.detail.error);
                    resolve(event.detail.prices); // Use fallback prices
                }
            };

            window.addEventListener('onlybnb-price-response', handleResponse);

            // Send price fetch request
            console.log('[OnlyBnB] Dispatching BNB price fetch request...');
            window.dispatchEvent(new CustomEvent('onlybnb-fetch-bnb-price'));

            // Timeout after 3 seconds to avoid blocking UI
            setTimeout(() => {
                window.removeEventListener('onlybnb-price-response', handleResponse);
                console.log('[OnlyBnB] BNB price fetch timeout, using fallback prices');
                resolve({ usd: 600, sgd: 810 }); // Fallback prices
            }, 3000);
        });
    }

    private extractTotalPrice(): { amount: number; currency: string } {
        console.log('[OnlyBnB] Extracting booking price from page...');

        // Try multiple selectors to find the total price
        const priceSelectors = [
            // Specific Airbnb selectors
            '[data-testid="book-it-default"] span:contains("Total")',
            '[data-testid="book-it-default"] div:contains("SGD")',
            '[data-testid="book-it-default"] div:contains("USD")',
            '[data-testid="book-it-default"] div:contains("$")',
            // Price summary selectors
            'div[aria-label*="price"]',
            'div[class*="price-item"] span:contains("Total")',
            'div[class*="total"] span:contains("$")',
            // Generic price patterns
            'span:contains("Total")',
            'div:contains("Total") span:contains("$")',
        ];

        // Look for price in the visible elements
        const priceElements = document.querySelectorAll('span, div');
        let totalPrice = 0;
        let currency = 'USD';

        for (const element of priceElements) {
            const text = element.textContent?.trim() || '';

            // Match patterns like "$125.12 SGD", "SGD $125.12", "$125.12", etc.
            const priceMatch = text.match(/(?:SGD\s*)?(?:\$|USD\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:SGD|USD)?/i);

            if (priceMatch && text.toLowerCase().includes('total')) {
                const amountStr = priceMatch[1].replace(/,/g, '');
                const amount = parseFloat(amountStr);

                if (amount > totalPrice) {
                    totalPrice = amount;
                    // Detect currency
                    if (text.includes('SGD') || text.includes('S$')) {
                        currency = 'SGD';
                    } else if (text.includes('USD') || text.includes('US$')) {
                        currency = 'USD';
                    }
                }
            }
        }

        // If no price found, try the current page content
        if (totalPrice === 0) {
            const pageText = document.body.textContent || '';
            const fallbackMatch = pageText.match(/Total[^$]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(SGD|USD)?/i);

            if (fallbackMatch) {
                totalPrice = parseFloat(fallbackMatch[1].replace(/,/g, ''));
                currency = fallbackMatch[2] || 'SGD';
            }
        }

        console.log('[OnlyBnB] Extracted price:', totalPrice, currency);
        return { amount: totalPrice || 125.12, currency: currency.toUpperCase() };
    }

    private async calculateBNBAmount(): Promise<{ bnbAmount: string; exchangeRate: number; totalPrice: { amount: number; currency: string } }> {
        try {
            // Get booking price from the page
            const totalPrice = this.extractTotalPrice();
            console.log('[OnlyBnB] Total booking price:', totalPrice);

            // Get current BNB price
            const bnbPrices = await this.fetchBNBPrice();
            console.log('[OnlyBnB] BNB prices:', bnbPrices);

            // Select the appropriate exchange rate based on currency
            const exchangeRate = totalPrice.currency === 'SGD' ? bnbPrices.sgd : bnbPrices.usd;

            // Calculate BNB amount needed
            const bnbAmount = (totalPrice.amount / exchangeRate).toFixed(6);

            console.log('[OnlyBnB] Calculated BNB amount:', {
                totalPrice: totalPrice,
                exchangeRate: exchangeRate,
                bnbAmount: bnbAmount
            });

            return {
                bnbAmount,
                exchangeRate,
                totalPrice
            };
        } catch (error) {
            console.error('[OnlyBnB] Error calculating BNB amount:', error);

            // Fallback calculation
            return {
                bnbAmount: '0.2084',
                exchangeRate: 600,
                totalPrice: { amount: 125.12, currency: 'SGD' }
            };
        }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================

    public destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

// Initialize the injector
let injector: OnlyBnBInjector | null = null;

// Clean up on page navigation
window.addEventListener('beforeunload', () => {
    if (injector) {
        injector.destroy();
        injector = null;
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injector = new OnlyBnBInjector();
    });
} else {
    injector = new OnlyBnBInjector();
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PAYMENT_1COMPLETE' || request.type === 'PAYMENT_CONFIRMED') {
        // Handle successful payment
        console.log('[OnlyBnB] Payment completed successfully');

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
        `;
        successMessage.innerHTML = '✓ Crypto payment successful!<br><small>Completing your booking...</small>';
        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.remove();
        }, 5000);

        sendResponse({ success: true });
    }

    return true; // Keep the message channel open
});
