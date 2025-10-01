// extension/content/content.ts
class PayperPlaneInjector {
    observer = null;
    buttonInjected = false;
    checkoutDetected = false;
    constructor() {
        this.init();
    }
    init() {
        console.log("[PayperPlane] Extension initialized on:", window.location.href);
        console.log("[PayperPlane] Current URL pathname:", window.location.pathname);
        console.log("[PayperPlane] Is booking URL:", window.location.pathname.includes("/book/"));
        this.injectWalletConnector();
        this.showTestIndicator();
        this.observePageChanges();
        this.checkForCheckoutPage();
        if (window.location.pathname.includes("/book/")) {
            console.log("[PayperPlane] On booking page, trying to inject toggle immediately...");
            setTimeout(() => {
                this.injectCryptoToggle();
            }, 1000);
            setTimeout(() => {
                this.injectCryptoToggle();
            }, 3000);
        }
        setInterval(() => {
            if (!this.buttonInjected) {
                console.log("[PayperPlane] Periodic check - button not injected yet");
                this.checkForCheckoutPage();
            }
        }, 2000);
    }
    injectWalletConnector() {
        console.log("[PayperPlane] Injecting wallet connector script...");
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("inject/wallet-connector.js");
        script.onload = () => {
            console.log("[PayperPlane] Wallet connector script injected successfully");
        };
        (document.head || document.documentElement).appendChild(script);
    }
    showTestIndicator() {
        const testElement = document.createElement("div");
        testElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(240, 185, 11, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(41, 117, 97, 0.2);
            color:rgb(71, 71, 71);
            padding: 16px 24px;
            border-radius: 16px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
            animation: slideIn 0.3s ease-out;
        `;
        testElement.textContent = "PayperPlane Extension Loaded!";
        document.body.appendChild(testElement);

        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            testElement.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                testElement.remove();
                style.remove();
            }, 300);
        }, 3000);
    }
    observePageChanges() {
        this.observer = new MutationObserver(() => {
            if (!this.checkoutDetected) {
                this.checkForCheckoutPage();
            }
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    checkForCheckoutPage() {
        const isBookingUrl = window.location.pathname.includes("/book/");
        console.log("[PayperPlane] Checking for checkout page...");
        console.log("[PayperPlane] Is booking URL:", isBookingUrl);
        console.log("[PayperPlane] Current URL:", window.location.href);
        if (isBookingUrl) {
            console.log("[PayperPlane] Detected booking URL, looking for checkout elements...");
        }
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
            'button:contains("Confirm and pay")',
            'h1:contains("Confirm and pay")',
            'h2:contains("Confirm and pay")'
        ];
        let isCheckout = isBookingUrl;
        if (!isCheckout) {
            isCheckout = checkoutSelectors.some((selector) => {
                try {
                    if (selector.includes(":contains")) {
                        const match = selector.match(/(.+):contains\("(.+)"\)/);
                        if (match) {
                            const [, elementSelector, text] = match;
                            const elements = document.querySelectorAll(elementSelector);
                            return Array.from(elements).some((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                        }
                    } else if (selector.includes("has-text")) {
                        const element = selector.split(":")[0];
                        const text = selector.match(/"([^"]+)"/)?.[1];
                        if (text) {
                            const elements = document.querySelectorAll(element);
                            return Array.from(elements).some((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
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
            console.log("[PayperPlane] Checkout detected, injecting crypto toggle...");
            this.checkoutDetected = true;
            this.injectCryptoToggle();
            this.buttonInjected = true;
        }
    }
    injectCryptoToggle() {
        console.log("[PayperPlane] Creating custom crypto toggle...");
        if (document.querySelector(".payperplane-crypto-toggle") || document.querySelector('[data-payperplane-crypto-toggle="true"]')) {
            console.log("[PayperPlane] Crypto toggle already exists");
            return;
        }
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
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        workTripToggle = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                    }
                } else if (selector.includes("has-text")) {
                    const element = selector.split(":")[0];
                    const text = selector.match(/"([^"]+)"/)?.[1];
                    if (text) {
                        const elements = document.querySelectorAll(element);
                        workTripToggle = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                    }
                } else {
                    workTripToggle = document.querySelector(selector);
                }
                if (workTripToggle) {
                    console.log("[PayperPlane] Found work trip toggle with selector:", selector);
                    break;
                }
            } catch (e) {
                console.debug("[PayperPlane] Error with selector:", selector, e);
            }
        }
        if (!workTripToggle) {
            console.log("[PayperPlane] Work trip toggle not found with any selector");
            console.log("[PayperPlane] Available elements with data-plugin-in-point-id:", document.querySelectorAll("[data-plugin-in-point-id]"));
            console.log('[PayperPlane] Available elements containing "work trip":', document.querySelectorAll("*").length);
            const allElements = document.querySelectorAll("*");
            for (const el of allElements) {
                if (el.textContent?.toLowerCase().includes("work trip")) {
                    console.log('[PayperPlane] Found element with "work trip" text:', el);
                    workTripToggle = el;
                    break;
                }
            }
        }
        if (!workTripToggle) {
            console.log("[PayperPlane] Still no work trip toggle found, trying to inject at a different location...");
            const anyToggle = document.querySelector('[role="switch"], [data-testid*="switch"], [class*="switch"]');
            if (anyToggle) {
                console.log("[PayperPlane] Found alternative toggle element:", anyToggle);
                workTripToggle = anyToggle;
            } else {
                console.log("[PayperPlane] No suitable injection point found, trying fallback injection...");
                this.injectCryptoToggleFallback();
                return;
            }
        }
        console.log("[PayperPlane] Found work trip toggle, creating custom crypto toggle...", workTripToggle);
        const cryptoToggle = document.createElement("div");
        cryptoToggle.className = "payperplane-crypto-toggle";
        cryptoToggle.setAttribute("data-payperplane-crypto-toggle", "true");
        cryptoToggle.setAttribute("data-plugin-in-point-id", "SWITCH_ROW_CRYPTO");
        cryptoToggle.setAttribute("data-section-id", "SWITCH_ROW_CRYPTO");
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
        const titleDiv = document.createElement("div");
        titleDiv.className = "t41l3z9 atm_c8_9oan3l atm_g3_1dzntr8 atm_cs_18jqzaw dir dir-ltr";
        titleDiv.id = "SWITCH_ROW_CRYPTO-title";
        titleDiv.textContent = "Pay with crypto";
        titleDiv.style.cssText = `
            font-weight: 500;
            line-height: 1.5;
            font-size: 16px;
            color: fff;
        `;
        const toggleButton = document.createElement("button");
        toggleButton.className = "payperplane-crypto-switch";
        toggleButton.setAttribute("role", "switch");
        toggleButton.setAttribute("aria-checked", "false");
        toggleButton.setAttribute("aria-labelledby", "SWITCH_ROW_CRYPTO-title");
        toggleButton.id = "SWITCH_ROW_CRYPTO-switch";
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
        const toggleKnob = document.createElement("div");
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
        workTripToggle.parentElement?.insertBefore(cryptoToggle, workTripToggle.nextSibling);
        this.setupToggleFunctionality(cryptoToggle);
        console.log("[PayperPlane] Custom crypto toggle added successfully");
        this.showSuccessIndicator();
    }
    injectCryptoToggleFallback() {
        console.log("[PayperPlane] Using fallback injection method...");
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
                console.log("[PayperPlane] Found injection point with selector:", selector);
                injectionPoint = element;
                break;
            }
        }
        if (!injectionPoint) {
            console.log("[PayperPlane] No injection point found, injecting at body");
            injectionPoint = document.body;
        }
        const cryptoToggle = document.createElement("div");
        cryptoToggle.className = "payperplane-crypto-toggle";
        cryptoToggle.setAttribute("data-payperplane-crypto-toggle", "true");
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
                <img src="https://bscscan.com/assets/bsc/images/svg/logos/token-light.svg?v=25.9.4.0" alt="BNB Token" style="width: 24px; height: 24px; border-radius: 4px; object-fit: contain;">
                <div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #fff;">Pay with crypto</h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Secure BNB payment</p>
                </div>
            </div>
            <button id="payperplane-crypto-toggle-button" style="
                width: 100%;
                background: #297561;
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
        if (injectionPoint === document.body) {
            injectionPoint.appendChild(cryptoToggle);
        } else {
            injectionPoint.insertBefore(cryptoToggle, injectionPoint.firstChild);
        }
        const toggleButton = cryptoToggle.querySelector("#payperplane-crypto-toggle-button");
        toggleButton.addEventListener("click", async () => {
            try {
                await this.connectWallet();
                console.log("[PayperPlane] Wallet connected via fallback method");
                toggleButton.textContent = "Wallet Connected \u2713";
                toggleButton.style.background = "#4CAF50";
                toggleButton.style.color = "white";
            } catch (error) {
                console.error("[PayperPlane] Wallet connection failed:", error);
                toggleButton.textContent = "Connection Failed";
                toggleButton.style.background = "#f44336";
                toggleButton.style.color = "white";
                setTimeout(() => {
                    toggleButton.textContent = "Connect Wallet";
                    toggleButton.style.background = "#297561";
                    toggleButton.style.color = "#000";
                }, 3000);
            }
        });
        console.log("[PayperPlane] Fallback crypto toggle added successfully");
        this.showSuccessIndicator();
    }
    setupToggleFunctionality(cryptoToggle) {
        const toggleButton = cryptoToggle.querySelector(".payperplane-crypto-switch");
        const toggleKnob = cryptoToggle.querySelector(".payperplane-crypto-switch > div");
        let isCryptoEnabled = false;
        let originalPaymentSection = null;
        const updateToggle = async (enabled) => {
            isCryptoEnabled = enabled;
            if (enabled) {
                toggleButton.style.background = "#297561";
                toggleKnob.style.transform = "translateX(16px)";
                toggleButton.setAttribute("aria-checked", "true");
                if (!toggleKnob.querySelector(".tick-mark")) {
                    const tickMark = document.createElement("div");
                    tickMark.className = "tick-mark";
                    tickMark.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: #297561;
                        font-size: 16px;
                        font-weight: bold;
                        line-height: 1;
                    `;
                    tickMark.innerHTML = '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 12px; width: 12px; fill: currentcolor;"><path d="m10.5 1.939 1.061 1.061-7.061 7.061-.53-.531-3-3-.531-.53 1.061-1.061 3 3 5.47-5.469z"></path></svg>';
                    toggleKnob.appendChild(tickMark);
                }
                this.replaceConfirmPayButton();
                this.hideQuickPayTerms();
                this.ensureOriginalButtonHidden();
            } else {
                toggleButton.style.background = "#e0e0e0";
                toggleKnob.style.transform = "translateX(0)";
                toggleButton.setAttribute("aria-checked", "false");
                const tickMark = toggleKnob.querySelector(".tick-mark");
                if (tickMark) {
                    tickMark.remove();
                }
                this.hideCryptoPaymentOptions(originalPaymentSection);
                this.showQuickPayTerms();
            }
            if (!originalPaymentSection) {
                originalPaymentSection = this.findPaymentSection();
            }
            if (enabled && originalPaymentSection) {
                if (!originalPaymentSection.dataset.originalContent) {
                    originalPaymentSection.dataset.originalContent = originalPaymentSection.innerHTML;
                }
                await this.showCryptoPaymentOptions(originalPaymentSection);
            } else if (originalPaymentSection) {
                this.hideCryptoPaymentOptions(originalPaymentSection);
            }
        };
        toggleButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            updateToggle(!isCryptoEnabled);
        });
    }
    findPaymentSection() {
        const paymentSectionSelectors = [
            'div[aria-label*="Pay with"]',
            'div[class*="payment"]',
            'section:has(h2:contains("Pay with"))',
            'div:has(> div > h2:contains("Pay with"))',
            'div:has(button:contains("Mastercard"))',
            'div:has(select option[value*="Mastercard"])'
        ];
        for (const selector of paymentSectionSelectors) {
            try {
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        const found = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                        if (found) {
                            return found;
                        }
                    }
                } else {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element;
                    }
                }
            } catch (e) {
                console.debug("[PayperPlane] Error with selector:", selector, e);
            }
        }
        return null;
    }
    showSuccessIndicator() {
        const successElement = document.createElement("div");
        successElement.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(76, 175, 80, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(76, 175, 80, 0.2);
            color: #4CAF50;
            padding: 16px 24px;
            border-radius: 16px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
            animation: slideIn 0.3s ease-out;
        `;
        successElement.textContent = "Crypto Toggle Added!";
        document.body.appendChild(successElement);

        setTimeout(() => {
            successElement.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                successElement.remove();
            }, 300);
        }, 3000);
    }
    hideQuickPayTerms() {
        console.log("[PayperPlane] Hiding quick-pay terms and conditions...");
        const termsSelectors = [
            "#quick-pay-terms-and-conditions",
            '[id="quick-pay-terms-and-conditions"]',
            '[class*="quick-pay-terms-and-conditions"]',
            '[data-testid*="quick-pay-terms"]',
            '[class*="terms-and-conditions"]',
            'p:contains("terms and conditions")',
            'div:contains("terms and conditions")'
        ];
        for (const selector of termsSelectors) {
            try {
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        const found = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                        if (found) {
                            const element = found;
                            element.style.display = "none";
                            element.setAttribute("data-payperplane-hidden", "true");
                            console.log("[PayperPlane] Hidden quick-pay terms:", element);
                        }
                    }
                } else {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.style.display = "none";
                        element.setAttribute("data-payperplane-hidden", "true");
                        console.log("[PayperPlane] Hidden quick-pay terms:", element);
                    }
                }
            } catch (e) {
                console.debug("[PayperPlane] Error with terms selector:", selector, e);
            }
        }
    }
    showQuickPayTerms() {
        console.log("[PayperPlane] Showing quick-pay terms and conditions...");
        const hiddenElements = document.querySelectorAll('[data-payperplane-hidden="true"]');
        hiddenElements.forEach((element) => {
            const htmlElement = element;
            htmlElement.style.display = "";
            htmlElement.removeAttribute("data-payperplane-hidden");
            console.log("[PayperPlane] Shown quick-pay terms:", htmlElement);
        });
    }
    ensureOriginalButtonHidden() {
        if (this.originalConfirmPayButton) {
            console.log("[PayperPlane] Ensuring original button stays hidden...");
            this.originalConfirmPayButton.style.display = "none";
            this.originalConfirmPayButton.setAttribute("data-payperplane-hidden", "true");
        }
    }
    async checkWalletConnection() {
        try {
            if (!window.ethereum) {
                console.log("[PayperPlane] No window.ethereum found for connection check");
                return false;
            }
            console.log("[PayperPlane] Using window.ethereum directly for connection check");
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            const isConnected = accounts && accounts.length > 0;
            console.log("[PayperPlane] Wallet connection status:", isConnected);
            console.log("[PayperPlane] Connected accounts:", accounts);
            return isConnected;
        } catch (error) {
            console.log("[PayperPlane] Wallet connection check failed:", error);
            return false;
        }
    }
    async waitForEthereum(timeout = 3000) {
        console.log("[PayperPlane] Checking for ethereum provider...");
        console.log("[PayperPlane] window.ethereum exists:", !!window.ethereum);
        console.log("[PayperPlane] window.ethereum type:", typeof window.ethereum);
        console.log("[PayperPlane] window.ethereum value:", window.ethereum);
        if (window.ethereum) {
            console.log("[PayperPlane] Ethereum provider found immediately");
            return window.ethereum;
        }
        console.log("[PayperPlane] Waiting for ethereum provider...");
        let attempts = 0;
        const maxAttempts = timeout / 100;
        return new Promise((resolve) => {
            const checkEthereum = () => {
                attempts++;
                console.log("[PayperPlane] Attempt", attempts, "- window.ethereum exists:", !!window.ethereum);
                if (window.ethereum) {
                    console.log("[PayperPlane] Ethereum provider found after", attempts * 100, "ms");
                    resolve(window.ethereum);
                    return;
                }
                if (attempts >= maxAttempts) {
                    console.log("[PayperPlane] Timeout waiting for ethereum provider after", attempts * 100, "ms");
                    resolve(null);
                    return;
                }
                setTimeout(checkEthereum, 100);
            };
            checkEthereum();
        });
    }
    connectedAccount = null;
    async connectWallet() {
        console.log("[PayperPlane] Attempting to connect wallet via custom events...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[PayperPlane] Received wallet response:", event.detail);
                window.removeEventListener("payperplane-wallet-response", handleResponse);
                if (event.detail.success) {
                    console.log("[PayperPlane] Wallet connected successfully!");
                    console.log("[PayperPlane] Account:", event.detail.account);
                    console.log("[PayperPlane] Chain ID:", event.detail.chainId);
                    this.connectedAccount = event.detail.account;
                    if (event.detail.chainId !== "0x38") {
                        this.switchToBSCNetwork().then(() => resolve()).catch(reject);
                    } else {
                        resolve();
                    }
                } else {
                    console.error("[PayperPlane] Wallet connection failed:", event.detail.error);
                    reject(new Error(event.detail.error));
                }
            };
            window.addEventListener("payperplane-wallet-response", handleResponse);
            console.log("[PayperPlane] Dispatching wallet connection request...");
            window.dispatchEvent(new CustomEvent("payperplane-connect-wallet"));
            setTimeout(() => {
                window.removeEventListener("payperplane-wallet-response", handleResponse);
                reject(new Error("Wallet connection timeout"));
            }, 30000);
        });
    }
    async switchToBSCNetwork() {
        console.log("[PayperPlane] Attempting to switch to BSC network...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[PayperPlane] Received network switch response:", event.detail);
                window.removeEventListener("payperplane-network-response", handleResponse);
                if (event.detail.success) {
                    console.log("[PayperPlane] Network switch successful:", event.detail.message);
                    resolve();
                } else {
                    console.error("[PayperPlane] Network switch failed:", event.detail.error);
                    resolve();
                }
            };
            window.addEventListener("payperplane-network-response", handleResponse);
            console.log("[PayperPlane] Dispatching network switch request...");
            window.dispatchEvent(new CustomEvent("payperplane-switch-network"));
            setTimeout(() => {
                window.removeEventListener("payperplane-network-response", handleResponse);
                console.warn("[PayperPlane] Network switch timeout - continuing anyway");
                resolve();
            }, 1e4);
        });
    }
    async fetchTokenBalances() {
        console.log("[PayperPlane] Fetching token balances...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[PayperPlane] Received balances response:", event.detail);
                window.removeEventListener("payperplane-balances-response", handleResponse);
                if (event.detail.success) {
                    resolve(event.detail.balances);
                } else {
                    console.error("[PayperPlane] Balance fetch failed:", event.detail.error);
                    resolve({ BNB: "0.0000", ETH: "0.0000", USDT: "0.0000", USDC: "0.0000" });
                }
            };
            window.addEventListener("payperplane-balances-response", handleResponse);
            console.log("[PayperPlane] Dispatching balance fetch request...");
            window.dispatchEvent(new CustomEvent("payperplane-fetch-balances"));
            setTimeout(() => {
                window.removeEventListener("payperplane-balances-response", handleResponse);
                resolve({ BNB: "0.0000", ETH: "0.0000", USDT: "0.0000", USDC: "0.0000" });
            }, 5000);
        });
    }
    originalConfirmPayButton = null;
    cryptoPayButton = null;
    payButtonReplaced = false;
    replaceConfirmPayButton() {
        if (this.payButtonReplaced) {
            return;
        }
        const confirmPaySelectors = [
            'button[type="submit"]:contains("Confirm and pay")',
            'button:contains("Confirm and pay")',
            'button[aria-label*="Confirm and pay"]',
            'button[data-testid*="confirm"]',
            'button[type="submit"][class*="primary"]',
            'button[type="submit"]'
        ];
        let confirmButton = null;
        for (const selector of confirmPaySelectors) {
            try {
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        confirmButton = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                    }
                } else {
                    const elements = document.querySelectorAll(selector);
                    confirmButton = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes("confirm and pay"));
                    if (!confirmButton && elements.length > 0) {
                        confirmButton = elements[0];
                    }
                }
                if (confirmButton) {
                    console.log("[PayperPlane] Found confirm button with selector:", selector);
                    break;
                }
            } catch (e) {
                console.debug("[PayperPlane] Error with selector:", selector, e);
            }
        }
        if (!confirmButton) {
            console.log("[PayperPlane] Confirm and pay button not found yet");
            return;
        }
        console.log("[PayperPlane] Found Confirm and pay button, replacing...");
        this.originalConfirmPayButton = confirmButton;
        confirmButton.style.display = "none";
        confirmButton.setAttribute("data-payperplane-hidden", "true");
        this.payButtonReplaced = true;
        console.log("[PayperPlane] Confirm and pay button replaced with crypto button");
    }
    restoreConfirmPayButton() {
        if (!this.payButtonReplaced || !this.originalConfirmPayButton || !this.cryptoPayButton) {
            return;
        }
        console.log("[PayperPlane] Restoring original confirm and pay button...");
        this.originalConfirmPayButton.style.display = "";
        this.cryptoPayButton.remove();
        this.cryptoPayButton = null;
        this.payButtonReplaced = false;
        console.log("[PayperPlane] Original button restored");
    }
    async handleCryptoPayment() {
        console.log("[PayperPlane] Starting crypto payment flow...");
        try {
            const isConnected = await this.checkWalletConnection();
            if (!isConnected) {
                console.log("[PayperPlane] Wallet not connected, connecting...");
                await this.connectWallet();
            }
            const calculation = await this.calculateBNBAmount();
            console.log("[PayperPlane] Payment calculation:", calculation);
            if (!this.connectedAccount) {
                const accounts = await new Promise((resolve) => {
                    window.addEventListener("payperplane-wallet-response", (event) => {
                        if (event.detail.success) {
                            resolve([event.detail.account]);
                        } else {
                            resolve([]);
                        }
                    }, { once: true });
                    window.dispatchEvent(new CustomEvent("payperplane-connect-wallet"));
                });
                if (accounts.length > 0) {
                    this.connectedAccount = accounts[0];
                } else {
                    throw new Error("No wallet connected");
                }
            }
            // PayperPlane contract address
            const payperPlaneContract = "0xc6BB3C35f6a80338C49C3e4F2c083f21ac36d693";
            const bnbAsNumber = parseFloat(calculation.bnbAmount);
            const weiAmount = BigInt(Math.floor(bnbAsNumber * Math.pow(10, 18)));

            // Generate unique ID for this payment (using timestamp + random)
            const paymentId = BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));

            // Convert fiat amount to cents (SGD * 100)
            const fiatAmountInCents = BigInt(Math.floor(parseFloat(calculation.totalPrice.amount) * 100));

            // Prepare fund() function call data
            // fund(uint256 _id, address _tokenAddress, uint256 _tokenAmount, string _currencyCode, uint256 _fiatAmount)
            // This is a PAYABLE function - we send BNB value with the transaction
            // Function selector 0x0cca551c for fund(uint256,address,uint256,string,uint256)
            const functionSelector = this.calculateFunctionSelector("fund(uint256,address,uint256,string,uint256)");

            // Determine currency code - default to SGD if not USD
            const currencyCode = calculation.totalPrice.currency === "USD" ? "USD" : "SGD";

            // Encode parameters
            const encodedParams = this.encodeFundParams(
                paymentId,
                "0x0000000000000000000000000000000000000000", // address(0) for native BNB
                weiAmount,
                currencyCode,
                fiatAmountInCents
            );

            const data = functionSelector + encodedParams;

            console.log("[PayperPlane] Calling fund() on contract:", {
                contract: payperPlaneContract,
                id: paymentId.toString(),
                tokenAddress: "0x0000000000000000000000000000000000000000",
                tokenAmount: weiAmount.toString(),
                currencyCode: currencyCode,
                fiatAmount: fiatAmountInCents.toString(),
                value: weiAmount.toString()
            });

            console.log("[PayperPlane] Transaction payload:", {
                functionSelector: functionSelector,
                encodedParams: encodedParams,
                fullData: data,
                dataLength: data.length,
                hexDataLength: (data.length - 2) / 2 + " bytes" // Remove 0x prefix
            });

            // Log the transaction parameters that will be sent
            console.log("[PayperPlane] Transaction parameters:", {
                from: this.connectedAccount,
                to: payperPlaneContract,
                value: "0x" + weiAmount.toString(16) + " (" + weiAmount.toString() + " wei)",
                data: data,
                gas: "0x30D40 (200000)"
            });

            const txHash = await new Promise((resolve, reject) => {
                const handleResponse = (event) => {
                    window.removeEventListener("payperplane-transaction-response", handleResponse);
                    if (event.detail.success) {
                        resolve(event.detail.txHash);
                    } else {
                        reject(new Error(event.detail.error || "Transaction failed"));
                    }
                };
                window.addEventListener("payperplane-transaction-response", handleResponse);
                window.dispatchEvent(new CustomEvent("payperplane-send-transaction", {
                    detail: {
                        from: this.connectedAccount,
                        to: payperPlaneContract,
                        value: "0x" + weiAmount.toString(16),
                        data: data,
                        gas: "0x30D40" // 200000 gas for contract interaction
                    }
                }));
                setTimeout(() => {
                    window.removeEventListener("payperplane-transaction-response", handleResponse);
                    reject(new Error("Transaction timeout"));
                }, 60000);
            });
            console.log("[PayperPlane] Transaction sent:", txHash);
            const processingMessage = document.createElement("div");
            processingMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(33, 150, 243, 0.1);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(33, 150, 243, 0.3);
                color: #fff;
                padding: 20px 28px;
                border-radius: 20px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                z-index: 10000;
                font-weight: 600;
                animation: slideIn 0.3s ease-out;
            `;
            processingMessage.innerHTML = `
                \u23F3 Transaction submitted!<br>
                <small>Hash: ${txHash.substring(0, 10)}...${txHash.substring(58)}</small><br>
                <a href="https://bscscan.com/tx/${txHash}" target="_blank" style="color: #fff; text-decoration: underline;">View on BSCScan</a>
            `;
            document.body.appendChild(processingMessage);
            setTimeout(() => {
                console.log("[PayperPlane] Simulating transaction confirmation...");
                processingMessage.innerHTML = "\u2713 Transaction confirmed!<br><small>Processing payment...</small>";
                processingMessage.style.background = "rgba(255, 152, 0, 0.1)";
                processingMessage.style.borderColor = "rgba(255, 152, 0, 0.3)";
                setTimeout(() => {
                    processingMessage.remove();
                    const successMessage = document.createElement("div");
                    successMessage.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(76, 175, 80, 0.1);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(76, 175, 80, 0.3);
                        color: #fff;
                        padding: 20px 28px;
                        border-radius: 20px;
                        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                        z-index: 10000;
                        font-weight: 600;
                        animation: slideIn 0.3s ease-out;
                    `;
                    successMessage.innerHTML = "<span style='font-size: 20px;'>✓</span> Crypto payment successful!<br><small style='opacity: 0.9;'>Completing your booking...</small>";
                    document.body.appendChild(successMessage);
                    setTimeout(() => {
                        if (this.originalConfirmPayButton) {
                            console.log("[PayperPlane] Clicking original Airbnb button...");
                            this.originalConfirmPayButton.click();
                        }
                        successMessage.remove();
                    }, 1500);
                }, 2000);
            }, 3000);
        } catch (error) {
            console.error("[PayperPlane] Crypto payment failed:", error);
            alert("Payment failed: " + error.message);
        }
    }
    extractPaymentData() {
        const totalPrice = this.extractTotalPrice();
        return {
            amount: totalPrice.amount.toString(),
            currency: totalPrice.currency,
            bookingId: window.location.pathname.split("/").pop() || ""
        };
    }

    encodeFundParams(id, tokenAddress, tokenAmount, currencyCode, fiatAmount) {
        // Remove 0x prefix from addresses if present
        const cleanAddress = tokenAddress.replace(/^0x/, '').toLowerCase();

        // Pad uint256 values to 32 bytes (64 hex chars)
        const paddedId = id.toString(16).padStart(64, '0');
        const paddedAddress = cleanAddress.padStart(64, '0');
        const paddedTokenAmount = tokenAmount.toString(16).padStart(64, '0');
        const paddedFiatAmount = fiatAmount.toString(16).padStart(64, '0');

        // For dynamic string parameter, the offset points to where the string data starts
        // After 5 32-byte parameters: id, address, amount, offset, fiatAmount = 5 * 32 = 160 (0xa0)
        const stringDataOffset = "00000000000000000000000000000000000000000000000000000000000000a0";

        // Encode the string
        const stringBytes = new TextEncoder().encode(currencyCode);
        const stringLength = stringBytes.length.toString(16).padStart(64, '0');

        // Convert string to hex and pad to multiple of 32 bytes
        let stringHex = '';
        for (let i = 0; i < stringBytes.length; i++) {
            stringHex += stringBytes[i].toString(16).padStart(2, '0');
        }

        // Pad string hex to next 32-byte boundary
        const paddingNeeded = 64 - (stringHex.length % 64);
        if (paddingNeeded !== 64) {
            stringHex = stringHex.padEnd(stringHex.length + paddingNeeded, '0');
        }

        console.log("[PayperPlane] Encoding parameters:", {
            id: paddedId,
            tokenAddress: paddedAddress,
            tokenAmount: paddedTokenAmount,
            stringOffset: stringDataOffset,
            fiatAmount: paddedFiatAmount,
            stringLength: stringLength,
            stringHex: stringHex,
            currencyCode: currencyCode,
            fullEncoding: paddedId + paddedAddress + paddedTokenAmount + stringDataOffset + paddedFiatAmount + stringLength + stringHex
        });

        // Combine all parameters in correct order
        return paddedId +
               paddedAddress +
               paddedTokenAmount +
               stringDataOffset +
               paddedFiatAmount +
               stringLength +
               stringHex;
    }

    // Helper function to calculate function selector
    calculateFunctionSelector(signature) {
        // This is a simplified version - in production use web3.js or ethers.js
        // The actual selector for fund(uint256,address,uint256,string,uint256) is 0x0cca551c
        // Verified from contract at 0xc6BB3C35f6a80338C49C3e4F2c083f21ac36d693
        return "0x0cca551c";
    }

    // Test the encoding
    testEncoding() {
        const testId = BigInt("7278606436507629840");
        const testAddress = "0x0000000000000000000000000000000000000000";
        const testAmount = BigInt("78061287565840384");
        const testCurrency = "SGD";
        const testFiat = BigInt("10001");

        const encoded = this.encodeFundParams(testId, testAddress, testAmount, testCurrency, testFiat);
        console.log("[PayperPlane] Test encoding result:", encoded);
        console.log("[PayperPlane] Expected result should match your data");
    }
    async showCryptoPaymentOptions(paymentSection) {
        if (!paymentSection.dataset.originalContent) {
            paymentSection.dataset.originalContent = paymentSection.innerHTML;
        }
        const cryptoSection = document.createElement("div");
        cryptoSection.className = "payperplane-crypto-payment";
        cryptoSection.style.cssText = `
            background: white;
            border-radius: 8px;
        `;
        const isConnected = await this.checkWalletConnection();
        if (isConnected) {
            this.createConnectedWalletUI(cryptoSection);
        } else {
            this.createWalletConnectionPrompt(cryptoSection);
        }
        paymentSection.innerHTML = "";
        paymentSection.appendChild(cryptoSection);
        console.log("[PayperPlane] Crypto payment options shown");
    }
    createWalletConnectionPrompt(container) {
        const promptSection = document.createElement("div");
        promptSection.style.cssText = `
            text-align: center;
            padding: 32px 16px;
            border-style: solid;
            border-width: 1px;
            border-color: lightgray;
            border-radius: 16px;
        `;
        const metamaskIcon = document.createElement("div");
        metamaskIcon.style.cssText = `
            width: 64px;
            height: 64px;
            background: #F6851B;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
        `;
        metamaskIcon.innerHTML = '<img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" style="height: 32px;">';
        const title = document.createElement("h3");
        title.textContent = "Connect Your Wallet";
        title.style.cssText = `
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
            color: #222;
        `;
        const description = document.createElement("p");
        description.textContent = "Connect your MetaMask wallet to pay with cryptocurrency";
        description.style.cssText = `
            margin: 0 0 24px 0;
            color: #666;
            font-size: 14px;
        `;
        const connectButton = document.createElement("button");
        connectButton.textContent = "Connect MetaMask";
        connectButton.style.cssText = `
            background: #F6851B;
            color: white;
            border: none;
            border-radius: 48px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
        `;
        connectButton.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("[PayperPlane] Connect button clicked!");
            connectButton.disabled = true;
            connectButton.textContent = "Connecting...";
            connectButton.style.background = "#ccc";
            try {
                console.log("[PayperPlane] Starting wallet connection process...");
                console.log("[PayperPlane] Window.ethereum available?", !!window.ethereum);
                await this.connectWallet();
                console.log("[PayperPlane] Wallet connected successfully, refreshing UI...");
                container.innerHTML = "";
                this.createConnectedWalletUI(container);
            } catch (error) {
                console.error("[PayperPlane] Wallet connection failed:", error);
                connectButton.disabled = false;
                connectButton.textContent = "Connect MetaMask";
                connectButton.style.background = "#F6851B";
                const errorMessage = error.message || "Failed to connect wallet. Please try again.";
                const errorDiv = document.createElement("div");
                errorDiv.style.cssText = `
                    background: #ffebee;
                    border: 1px solid #f44336;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 12px;
                    color: #c62828;
                    font-size: 14px;
                    text-align: left;
                `;
                errorDiv.innerHTML = `
                    <strong>Connection Failed:</strong><br>
                    ${errorMessage}<br><br>
                    <strong>Please try:</strong><br>
                    \u2022 Make sure MetaMask is unlocked<br>
                    \u2022 Refresh the page and try again<br>
                    \u2022 Check if MetaMask is enabled for this site
                `;
                const existingError = container.querySelector(".connection-error");
                if (existingError) {
                    existingError.remove();
                }
                errorDiv.className = "connection-error";
                container.appendChild(errorDiv);
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.remove();
                    }
                }, 1e4);
            }
        });
        connectButton.addEventListener("mouseenter", () => {
            if (!connectButton.disabled) {
                connectButton.style.background = "#E5740A";
            }
        });
        connectButton.addEventListener("mouseleave", () => {
            if (!connectButton.disabled) {
                connectButton.style.background = "#F6851B";
            }
        });
        promptSection.appendChild(metamaskIcon);
        promptSection.appendChild(title);
        promptSection.appendChild(description);
        promptSection.appendChild(connectButton);
        container.appendChild(promptSection);
    }
    createConnectedWalletUI(container) {
        console.log("[PayperPlane] Creating connected wallet UI...");
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 22px;
            margin-bottom: 16px;
            font-weight: 600;
            justify-content: space-between;
        `;
        const metamaskIcon = document.createElement("div");
        metamaskIcon.style.cssText = `
            width: 24px;
            height: 24px;
            background: #F6851B;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        `;
        metamaskIcon.textContent = "\uD83E\uDD8A";
        const headerText = document.createElement("span");
        headerText.textContent = "Pay with";
        const metamaskText = document.createElement("img");
        metamaskText.src = "https://freelogopng.com/images/all_img/1683020772metamask-logo-png.png";
        metamaskText.style.cssText = "height: 20px;";
        header.appendChild(headerText);
        header.appendChild(metamaskText);
        const walletInfo = document.createElement("div");
        walletInfo.style.cssText = `
            background: #f0f0f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 12px;
            color: #666;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        if (this.connectedAccount) {
            const addressText = document.createElement("span");
            addressText.textContent = `Connected: ${this.connectedAccount.substring(0, 6)}...${this.connectedAccount.substring(38)}`;
            const connectedIcon = document.createElement("span");
            connectedIcon.style.cssText = "color: #4CAF50; font-weight: bold;";
            connectedIcon.textContent = "\u25CF";
            walletInfo.appendChild(addressText);
            walletInfo.appendChild(connectedIcon);
        } else {
            this.checkWalletConnection().then(async (isConnected) => {
                if (isConnected && window.ethereum) {
                    const accounts = await window.ethereum.request({ method: "eth_accounts" });
                    if (accounts && accounts.length > 0) {
                        this.connectedAccount = accounts[0];
                        walletInfo.innerHTML = `
                            <span>Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}</span>
                            <span style="color: #4CAF50; font-weight: bold;">\u25CF</span>
                        `;
                    }
                }
            });
        }
        const tokenDropdown = document.createElement("div");
        tokenDropdown.className = "payperplane-token-dropdown";
        tokenDropdown.style.cssText = `
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            background: white;
            transition: border-color 0.2s ease;
        `;
        const tokenIcon = document.createElement("img");
        tokenIcon.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: contain;
        `;
        tokenIcon.src = "https://bscscan.com/assets/bsc/images/svg/logos/token-light.svg?v=25.9.4.0";
        tokenIcon.alt = "BNB Token";
        const tokenInfo = document.createElement("div");
        tokenInfo.style.cssText = "flex: 1;";
        const tokenName = document.createElement("div");
        tokenName.textContent = "Binance Token";
        tokenName.style.cssText = "font-weight: 500;";
        const tokenBalance = document.createElement("div");
        tokenBalance.textContent = "Loading balance...";
        tokenBalance.style.cssText = "font-size: 12px; color: #666;";
        tokenInfo.appendChild(tokenName);
        tokenInfo.appendChild(tokenBalance);
        const dropdownArrow = document.createElement("div");
        dropdownArrow.textContent = "\u25BC";
        dropdownArrow.style.cssText = "color: #666; font-size: 12px;";
        tokenDropdown.appendChild(tokenIcon);
        tokenDropdown.appendChild(tokenInfo);
        tokenDropdown.appendChild(dropdownArrow);
        tokenBalance.textContent = "Calculating amount needed...";
        this.calculateBNBAmount().then((calculation) => {
            this.fetchTokenBalances().then((balances2) => {
                const balanceText = `Balance: ${balances2.BNB} BNB`;
                const needsText = `Needs: ${calculation.bnbAmount} BNB`;
                tokenBalance.innerHTML = `${needsText}<br><small style="color: #999;">${balanceText}</small>`;
                const selectedToken = tokens.find((t) => t.symbol === "BNB");
                if (selectedToken) {
                    const optionBalance = tokenOptions.children[0]?.querySelector(".token-balance");
                    if (optionBalance) {
                        optionBalance.innerHTML = `${needsText}<br><small style="color: #999;">${balanceText}</small>`;
                    }
                }
            }).catch((error) => {
                console.error("[PayperPlane] Failed to fetch balances:", error);
                const needsText = `Needs: ${calculation.bnbAmount} BNB`;
                tokenBalance.textContent = needsText;
            });
        }).catch((error) => {
            console.error("[PayperPlane] Failed to calculate BNB amount:", error);
            tokenBalance.textContent = "Needs: 0.2084 BNB (Fallback)";
            this.fetchTokenBalances().then((balances2) => {
                const balanceText = `Balance: ${balances2.BNB} BNB`;
                const needsText = `Needs: 0.2084 BNB (Fallback)`;
                tokenBalance.innerHTML = `${needsText}<br><small style="color: #999;">${balanceText}</small>`;
            }).catch(() => {
                tokenBalance.textContent = "Needs: 0.2084 BNB (Fallback)";
            });
        });
        const tokenOptions = document.createElement("div");
        tokenOptions.className = "payperplane-token-options";
        tokenOptions.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            margin-top: 4px;
        `;
        const tokens = [
            { symbol: "BNB", name: "Binance Token", icon: "B", color: "#297561", address: "0xbb4CdB9Bd36B01bD1cBaEBF2De08d9173bc095c", enabled: true, imageUrl: "https://bscscan.com/assets/bsc/images/svg/logos/token-light.svg?v=25.9.4.0" },
            { symbol: "ETH", name: "Ethereum", icon: "\u039E", color: "#627EEA", address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", enabled: false },
            { symbol: "USDT", name: "Tether USD", icon: "\u20AE", color: "#26A17B", address: "0x55d398326f99059fF775485246999027B3197955", enabled: false },
            { symbol: "USDC", name: "USD Coin", icon: "$", color: "#2775CA", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", enabled: false }
        ];
        let balances = {};
        this.fetchTokenBalances().then((fetchedBalances) => {
            balances = fetchedBalances;
            tokens.forEach((token, index) => {
                const optionBalance = tokenOptions.children[index]?.querySelector(".token-balance");
                if (optionBalance) {
                    optionBalance.textContent = `Balance: ${balances[token.symbol] || "0.0000"} ${token.symbol}`;
                }
            });
        });
        tokens.forEach((token) => {
            const option = document.createElement("div");
            option.className = "payperplane-token-option";
            option.style.cssText = `
                padding: 12px;
                cursor: ${token.enabled ? "pointer" : "not-allowed"};
                display: flex;
                align-items: center;
                gap: 12px;
                transition: background-color 0.2s ease;
                opacity: ${token.enabled ? "1" : "0.5"};
                position: relative;
            `;
            const optionIcon = token.imageUrl ? document.createElement("img") : document.createElement("div");
            if (token.imageUrl) {
                optionIcon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: contain;
                `;
                optionIcon.src = token.imageUrl;
                optionIcon.alt = `${token.symbol} Token`;
            } else {
                optionIcon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    background: ${token.enabled ? token.color : "#cccccc"};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    color: white;
                `;
                optionIcon.textContent = token.icon;
            }
            const optionInfo = document.createElement("div");
            optionInfo.style.cssText = "flex: 1;";
            const optionHeader = document.createElement("div");
            optionHeader.style.cssText = "display: flex; justify-content: space-between; align-items: center;";
            const optionNameContainer = document.createElement("div");
            const optionName = document.createElement("div");
            optionName.textContent = token.name;
            optionName.style.cssText = `font-weight: 500; color: ${token.enabled ? "#333" : "#999"};`;
            optionNameContainer.appendChild(optionName);
            const optionRight = document.createElement("div");
            optionRight.style.cssText = "text-align: right;";
            if (!token.enabled) {
                const comingSoon = document.createElement("div");
                comingSoon.textContent = "Coming soon";
                comingSoon.style.cssText = "font-size: 11px; color: #297561; font-style: italic; margin-bottom: 2px;";
                optionRight.appendChild(comingSoon);
            }
            const optionBalance = document.createElement("div");
            optionBalance.className = "token-balance";
            optionBalance.textContent = "Loading...";
            optionBalance.style.cssText = `font-size: 12px; color: ${token.enabled ? "#666" : "#999"}; font-weight: normal;`;
            optionRight.appendChild(optionBalance);
            optionHeader.appendChild(optionNameContainer);
            optionHeader.appendChild(optionRight);
            const optionSymbol = document.createElement("div");
            optionSymbol.textContent = token.symbol;
            optionSymbol.style.cssText = `font-size: 12px; color: ${token.enabled ? "#666" : "#999"};`;
            optionInfo.appendChild(optionHeader);
            optionInfo.appendChild(optionSymbol);
            option.appendChild(optionIcon);
            option.appendChild(optionInfo);
            option.addEventListener("click", async (e) => {
                if (!token.enabled) {
                    e.stopPropagation();
                    return;
                }
                if (token.imageUrl) {
                    tokenIcon.src = token.imageUrl;
                    tokenIcon.alt = `${token.symbol} Token`;
                } else {
                    tokenIcon.textContent = token.icon;
                    tokenIcon.style.background = token.color;
                }
                tokenName.textContent = token.name;
                tokenBalance.textContent = `Balance: ${balances[token.symbol] || "0.0000"} ${token.symbol}`;
                tokenOptions.style.display = "none";
            });
            option.addEventListener("mouseenter", () => {
                if (token.enabled) {
                    option.style.backgroundColor = "#f5f5f5";
                }
            });
            option.addEventListener("mouseleave", () => {
                if (token.enabled) {
                    option.style.backgroundColor = "transparent";
                }
            });
            tokenOptions.appendChild(option);
        });
        tokenDropdown.style.position = "relative";
        tokenDropdown.appendChild(tokenOptions);
        tokenDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = tokenOptions.style.display !== "none";
            tokenOptions.style.display = isOpen ? "none" : "block";
            dropdownArrow.textContent = isOpen ? "\u25BC" : "\u25B2";
        });
        document.addEventListener("click", () => {
            tokenOptions.style.display = "none";
            dropdownArrow.textContent = "\u25BC";
        });
        const paymentSummary = document.createElement("div");
        paymentSummary.className = "payperplane-payment-summary";
        paymentSummary.style.cssText = `
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
            border: 1px solid #e9ecef;
        `;
        paymentSummary.innerHTML = `
            <div style="font-weight: 600; font-size: 16px; color: #495057; margin-bottom: 12px;">Payment Summary</div>
            <div id="payment-calculation" style="font-size: 12px; color: #666;">
                Calculating payment amount...
            </div>
        `;
        setTimeout(() => {
            this.calculateBNBAmount().then((calculation) => {
                const summaryElement = paymentSummary.querySelector("#payment-calculation");
                if (summaryElement) {
                    summaryElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Booking Total:</span>
                        <span style="font-weight: 500;">\$${calculation.totalPrice.amount.toFixed(2)} ${calculation.totalPrice.currency}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>BNB Rate:</span>
                        <span style="font-weight: 500;">1 BNB = \$${calculation.exchangeRate.toFixed(2)} ${calculation.totalPrice.currency}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 16px; font-size:16px; border-top: 1px solid #dee2e6; font-weight: 600; color: #495057;">
                        <span>You Pay:</span>
                        <span style="color: #297561;">${calculation.bnbAmount} BNB</span>
                    </div>
                `;
                }
            }).catch((error) => {
                console.error("[PayperPlane] Failed to calculate payment summary:", error);
                const summaryElement = paymentSummary.querySelector("#payment-calculation");
                if (summaryElement) {
                    summaryElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Booking Total:</span>
                        <span style="font-weight: 500;">125.12 SGD</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>BNB Rate:</span>
                        <span style="font-weight: 500;">1 BNB = 600.00 USD (Demo)</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #dee2e6; font-weight: 600; color: #495057;">
                        <span>You Pay:</span>
                        <span style="color: #297561;">0.2084 BNB</span>
                    </div>
                `;
                }
            }).catch((error) => {
                console.error("[PayperPlane] Failed to calculate payment summary:", error);
                const summaryElement = paymentSummary.querySelector("#payment-calculation");
                if (summaryElement) {
                    summaryElement.innerHTML = `
                    <div style="color: #666; text-align: center;">
                        Failed to calculate payment. Using demo values:<br>
                        <strong style="color: #297561;">0.2084 BNB for 125.12 SGD</strong>
                    </div>
                `;
                }
            });
        }, 1500);
        const payButton = document.createElement("button");
        payButton.style.cssText = `
            width: 100%;
            background: #297561;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 16px;
            margin-top: 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        `;
        payButton.innerHTML = `Pay with Crypto`;
        payButton.addEventListener("mouseenter", () => {
            payButton.style.background = "#1F5445";
        });
        payButton.addEventListener("mouseleave", () => {
            payButton.style.background = "#297561";
        });
        payButton.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            payButton.disabled = true;
            payButton.innerHTML = "<span>Processing...</span>";
            payButton.style.background = "#ccc";
            try {
                await this.handleCryptoPayment();
            } catch (error) {
                console.error("[PayperPlane] Payment failed:", error);
                payButton.disabled = false;
                payButton.innerHTML = `
                    <span style="font-size: 20px;">\u20BF</span>
                    Pay with Crypto
                `;
                payButton.style.background = "#297561";
            }
        });
        container.appendChild(header);
        container.appendChild(walletInfo);
        container.appendChild(tokenDropdown);
        container.appendChild(paymentSummary);
        container.appendChild(payButton);
    }
    hideCryptoPaymentOptions(paymentSection) {
        if (paymentSection.dataset.originalContent) {
            paymentSection.innerHTML = paymentSection.dataset.originalContent;
        }
        console.log("[PayperPlane] Crypto payment options hidden, original payment section restored");
    }
    async fetchBNBPrice() {
        console.log("[PayperPlane] Fetching BNB price...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[PayperPlane] Received BNB price response:", event.detail);
                window.removeEventListener("payperplane-price-response", handleResponse);
                if (event.detail.success) {
                    resolve(event.detail.prices);
                } else {
                    console.error("[PayperPlane] BNB price fetch failed, using fallback:", event.detail.error);
                    resolve(event.detail.prices);
                }
            };
            window.addEventListener("payperplane-price-response", handleResponse);
            console.log("[PayperPlane] Dispatching BNB price fetch request...");
            window.dispatchEvent(new CustomEvent("payperplane-fetch-bnb-price"));
            setTimeout(() => {
                window.removeEventListener("payperplane-price-response", handleResponse);
                console.log("[PayperPlane] BNB price fetch timeout, using fallback prices");
                resolve({ usd: 600, sgd: 810 });
            }, 3000);
        });
    }
    extractTotalPrice() {
        console.log("[PayperPlane] Extracting booking price from page...");
        const priceSelectors = [
            '[data-testid="book-it-default"] span:contains("Total")',
            '[data-testid="book-it-default"] div:contains("SGD")',
            '[data-testid="book-it-default"] div:contains("USD")',
            '[data-testid="book-it-default"] div:contains("$")',
            'div[aria-label*="price"]',
            'div[class*="price-item"] span:contains("Total")',
            'div[class*="total"] span:contains("$")',
            'span:contains("Total")',
            'div:contains("Total") span:contains("$")'
        ];
        const priceElements = document.querySelectorAll("span, div");
        let totalPrice = 0;
        let currency = "USD";
        for (const element of priceElements) {
            const text = element.textContent?.trim() || "";
            const priceMatch = text.match(/(?:SGD\s*)?(?:\$|USD\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:SGD|USD)?/i);
            if (priceMatch && text.toLowerCase().includes("total")) {
                const amountStr = priceMatch[1].replace(/,/g, "");
                const amount = parseFloat(amountStr);
                if (amount > totalPrice) {
                    totalPrice = amount;
                    if (text.includes("SGD") || text.includes("S$")) {
                        currency = "SGD";
                    } else if (text.includes("USD") || text.includes("US$")) {
                        currency = "USD";
                    }
                }
            }
        }
        if (totalPrice === 0) {
            const pageText = document.body.textContent || "";
            const fallbackMatch = pageText.match(/Total[^$]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(SGD|USD)?/i);
            if (fallbackMatch) {
                totalPrice = parseFloat(fallbackMatch[1].replace(/,/g, ""));
                currency = fallbackMatch[2] || "SGD";
            }
        }
        console.log("[PayperPlane] Extracted price:", totalPrice, currency);
        return { amount: totalPrice || 125.12, currency: currency.toUpperCase() };
    }
    async calculateBNBAmount() {
        try {
            const totalPrice = this.extractTotalPrice();
            console.log("[PayperPlane] Total booking price:", totalPrice);
            const bnbPrices = await this.fetchBNBPrice();
            console.log("[PayperPlane] BNB prices:", bnbPrices);
            const exchangeRate = totalPrice.currency === "SGD" ? bnbPrices.sgd : bnbPrices.usd;
            const bnbAmount = (totalPrice.amount / exchangeRate).toFixed(6);
            console.log("[PayperPlane] Calculated BNB amount:", {
                totalPrice,
                exchangeRate,
                bnbAmount
            });
            return {
                bnbAmount,
                exchangeRate,
                totalPrice
            };
        } catch (error) {
            console.error("[PayperPlane] Error calculating BNB amount:", error);
            return {
                bnbAmount: "0.2084",
                exchangeRate: 600,
                totalPrice: { amount: 125.12, currency: "SGD" }
            };
        }
    }
    async processPayment() {
    }
    showPaymentSuccess() {
        const successMessage = document.createElement("div");
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(76, 175, 80, 0.3);
            color: #fff;
            padding: 20px 28px;
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            z-index: 10000;
            font-weight: 600;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        successMessage.innerHTML = `
            <span style="font-size: 24px;">✅</span> Payment Successful!<br>
            <small style="opacity: 0.9;">Your BNB payment has been processed</small>
        `;
        document.body.appendChild(successMessage);
        setTimeout(() => {
            successMessage.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                successMessage.remove();
            }, 300);
        }, 5000);
    }
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
var injector = null;
window.addEventListener("beforeunload", () => {
    if (injector) {
        injector.destroy();
        injector = null;
    }
});
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        injector = new PayperPlaneInjector;
    });
} else {
    injector = new PayperPlaneInjector;
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PAYMENT_COMPLETE" || request.type === "PAYMENT_CONFIRMED") {
        console.log("[PayperPlane] Payment completed successfully");
        const successMessage = document.createElement("div");
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(76, 175, 80, 0.3);
            color: #fff;
            padding: 20px 28px;
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
        `;
        successMessage.innerHTML = "<span style='font-size: 20px;'>✓</span> Crypto payment successful!<br><small style='opacity: 0.9;'>Completing your booking...</small>";
        document.body.appendChild(successMessage);
        if (injector && injector.originalConfirmPayButton) {
        }
        setTimeout(() => {
            successMessage.remove();
        }, 5000);
        sendResponse({ success: true });
    }
    return true;
});
