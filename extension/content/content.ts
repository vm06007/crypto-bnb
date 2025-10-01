// extension/content/content.ts
class OnlyBnBInjector {
  observer = null;
  buttonInjected = false;
  checkoutDetected = false;
  constructor() {
    this.init();
  }
  init() {
    console.log("[OnlyBnB] Extension initialized on:", window.location.href);
    console.log("[OnlyBnB] Current URL pathname:", window.location.pathname);
    console.log("[OnlyBnB] Is booking URL:", window.location.pathname.includes("/book/"));
    this.injectWalletConnector();
    this.showTestIndicator();
    this.observePageChanges();
    this.checkForCheckoutPage();
    if (window.location.pathname.includes("/book/")) {
      console.log("[OnlyBnB] On booking page, trying to inject toggle immediately...");
      setTimeout(() => {
        this.injectCryptoToggle();
      }, 1000);
      setTimeout(() => {
        this.injectCryptoToggle();
      }, 3000);
    }
    setInterval(() => {
      if (!this.buttonInjected) {
        console.log("[OnlyBnB] Periodic check - button not injected yet");
        this.checkForCheckoutPage();
      }
    }, 2000);
  }
  injectWalletConnector() {
    console.log("[OnlyBnB] Injecting wallet connector script...");
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject/wallet-connector.js");
    script.onload = () => {
      console.log("[OnlyBnB] Wallet connector script injected successfully");
    };
    (document.head || document.documentElement).appendChild(script);
  }
  showTestIndicator() {
    const testElement = document.createElement("div");
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
    testElement.textContent = "OnlyBnB Extension Loaded!";
    document.body.appendChild(testElement);
    setTimeout(() => {
      testElement.remove();
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
    console.log("[OnlyBnB] Checking for checkout page...");
    console.log("[OnlyBnB] Is booking URL:", isBookingUrl);
    console.log("[OnlyBnB] Current URL:", window.location.href);
    if (isBookingUrl) {
      console.log("[OnlyBnB] Detected booking URL, looking for checkout elements...");
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
      console.log("[OnlyBnB] Checkout detected, injecting crypto toggle...");
      this.checkoutDetected = true;
      this.injectCryptoToggle();
      this.buttonInjected = true;
    }
  }
  injectCryptoToggle() {
    console.log("[OnlyBnB] Creating custom crypto toggle...");
    if (document.querySelector(".onlybnb-crypto-toggle") || document.querySelector('[data-onlybnb-crypto-toggle="true"]')) {
      console.log("[OnlyBnB] Crypto toggle already exists");
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
          console.log("[OnlyBnB] Found work trip toggle with selector:", selector);
          break;
        }
      } catch (e) {
        console.debug("[OnlyBnB] Error with selector:", selector, e);
      }
    }
    if (!workTripToggle) {
      console.log("[OnlyBnB] Work trip toggle not found with any selector");
      console.log("[OnlyBnB] Available elements with data-plugin-in-point-id:", document.querySelectorAll("[data-plugin-in-point-id]"));
      console.log('[OnlyBnB] Available elements containing "work trip":', document.querySelectorAll("*").length);
      const allElements = document.querySelectorAll("*");
      for (const el of allElements) {
        if (el.textContent?.toLowerCase().includes("work trip")) {
          console.log('[OnlyBnB] Found element with "work trip" text:', el);
          workTripToggle = el;
          break;
        }
      }
    }
    if (!workTripToggle) {
      console.log("[OnlyBnB] Still no work trip toggle found, trying to inject at a different location...");
      const anyToggle = document.querySelector('[role="switch"], [data-testid*="switch"], [class*="switch"]');
      if (anyToggle) {
        console.log("[OnlyBnB] Found alternative toggle element:", anyToggle);
        workTripToggle = anyToggle;
      } else {
        console.log("[OnlyBnB] No suitable injection point found, trying fallback injection...");
        this.injectCryptoToggleFallback();
        return;
      }
    }
    console.log("[OnlyBnB] Found work trip toggle, creating custom crypto toggle...", workTripToggle);
    const cryptoToggle = document.createElement("div");
    cryptoToggle.className = "onlybnb-crypto-toggle";
    cryptoToggle.setAttribute("data-onlybnb-crypto-toggle", "true");
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
            color: #222222;
        `;
    const toggleButton = document.createElement("button");
    toggleButton.className = "onlybnb-crypto-switch";
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
    console.log("[OnlyBnB] Custom crypto toggle added successfully");
    this.showSuccessIndicator();
  }
  injectCryptoToggleFallback() {
    console.log("[OnlyBnB] Using fallback injection method...");
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
        console.log("[OnlyBnB] Found injection point with selector:", selector);
        injectionPoint = element;
        break;
      }
    }
    if (!injectionPoint) {
      console.log("[OnlyBnB] No injection point found, injecting at body");
      injectionPoint = document.body;
    }
    const cryptoToggle = document.createElement("div");
    cryptoToggle.className = "onlybnb-crypto-toggle";
    cryptoToggle.setAttribute("data-onlybnb-crypto-toggle", "true");
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
    if (injectionPoint === document.body) {
      injectionPoint.appendChild(cryptoToggle);
    } else {
      injectionPoint.insertBefore(cryptoToggle, injectionPoint.firstChild);
    }
    const toggleButton = cryptoToggle.querySelector("#onlybnb-crypto-toggle-button");
    toggleButton.addEventListener("click", async () => {
      try {
        await this.connectWallet();
        console.log("[OnlyBnB] Wallet connected via fallback method");
        toggleButton.textContent = "Wallet Connected \u2713";
        toggleButton.style.background = "#4CAF50";
        toggleButton.style.color = "white";
      } catch (error) {
        console.error("[OnlyBnB] Wallet connection failed:", error);
        toggleButton.textContent = "Connection Failed";
        toggleButton.style.background = "#f44336";
        toggleButton.style.color = "white";
        setTimeout(() => {
          toggleButton.textContent = "Connect Wallet";
          toggleButton.style.background = "#F0B90B";
          toggleButton.style.color = "#000";
        }, 3000);
      }
    });
    console.log("[OnlyBnB] Fallback crypto toggle added successfully");
    this.showSuccessIndicator();
  }
  setupToggleFunctionality(cryptoToggle) {
    const toggleButton = cryptoToggle.querySelector(".onlybnb-crypto-switch");
    const toggleKnob = cryptoToggle.querySelector(".onlybnb-crypto-switch > div");
    let isCryptoEnabled = false;
    let originalPaymentSection = null;
    const updateToggle = async (enabled) => {
      isCryptoEnabled = enabled;
      if (enabled) {
        toggleButton.style.background = "#F0B90B";
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
                        color: #F0B90B;
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
        console.debug("[OnlyBnB] Error with selector:", selector, e);
      }
    }
    return null;
  }
  showSuccessIndicator() {
    const successElement = document.createElement("div");
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
    successElement.textContent = "Crypto Toggle Added!";
    document.body.appendChild(successElement);
    setTimeout(() => {
      successElement.remove();
    }, 3000);
  }
  hideQuickPayTerms() {
    console.log("[OnlyBnB] Hiding quick-pay terms and conditions...");
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
              element.setAttribute("data-onlybnb-hidden", "true");
              console.log("[OnlyBnB] Hidden quick-pay terms:", element);
            }
          }
        } else {
          const element = document.querySelector(selector);
          if (element) {
            element.style.display = "none";
            element.setAttribute("data-onlybnb-hidden", "true");
            console.log("[OnlyBnB] Hidden quick-pay terms:", element);
          }
        }
      } catch (e) {
        console.debug("[OnlyBnB] Error with terms selector:", selector, e);
      }
    }
  }
  showQuickPayTerms() {
    console.log("[OnlyBnB] Showing quick-pay terms and conditions...");
    const hiddenElements = document.querySelectorAll('[data-onlybnb-hidden="true"]');
    hiddenElements.forEach((element) => {
      const htmlElement = element;
      htmlElement.style.display = "";
      htmlElement.removeAttribute("data-onlybnb-hidden");
      console.log("[OnlyBnB] Shown quick-pay terms:", htmlElement);
    });
  }
  ensureOriginalButtonHidden() {
    if (this.originalConfirmPayButton) {
      console.log("[OnlyBnB] Ensuring original button stays hidden...");
      this.originalConfirmPayButton.style.display = "none";
      this.originalConfirmPayButton.setAttribute("data-onlybnb-hidden", "true");
    }
  }
  async checkWalletConnection() {
    try {
      if (!window.ethereum) {
        console.log("[OnlyBnB] No window.ethereum found for connection check");
        return false;
      }
      console.log("[OnlyBnB] Using window.ethereum directly for connection check");
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const isConnected = accounts && accounts.length > 0;
      console.log("[OnlyBnB] Wallet connection status:", isConnected);
      console.log("[OnlyBnB] Connected accounts:", accounts);
      return isConnected;
    } catch (error) {
      console.log("[OnlyBnB] Wallet connection check failed:", error);
      return false;
    }
  }
  async waitForEthereum(timeout = 3000) {
    console.log("[OnlyBnB] Checking for ethereum provider...");
    console.log("[OnlyBnB] window.ethereum exists:", !!window.ethereum);
    console.log("[OnlyBnB] window.ethereum type:", typeof window.ethereum);
    console.log("[OnlyBnB] window.ethereum value:", window.ethereum);
    if (window.ethereum) {
      console.log("[OnlyBnB] Ethereum provider found immediately");
      return window.ethereum;
    }
    console.log("[OnlyBnB] Waiting for ethereum provider...");
    let attempts = 0;
    const maxAttempts = timeout / 100;
    return new Promise((resolve) => {
      const checkEthereum = () => {
        attempts++;
        console.log("[OnlyBnB] Attempt", attempts, "- window.ethereum exists:", !!window.ethereum);
        if (window.ethereum) {
          console.log("[OnlyBnB] Ethereum provider found after", attempts * 100, "ms");
          resolve(window.ethereum);
          return;
        }
        if (attempts >= maxAttempts) {
          console.log("[OnlyBnB] Timeout waiting for ethereum provider after", attempts * 100, "ms");
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
    console.log("[OnlyBnB] Attempting to connect wallet via custom events...");
    return new Promise((resolve, reject) => {
      const handleResponse = (event) => {
        console.log("[OnlyBnB] Received wallet response:", event.detail);
        window.removeEventListener("onlybnb-wallet-response", handleResponse);
        if (event.detail.success) {
          console.log("[OnlyBnB] Wallet connected successfully!");
          console.log("[OnlyBnB] Account:", event.detail.account);
          console.log("[OnlyBnB] Chain ID:", event.detail.chainId);
          this.connectedAccount = event.detail.account;
          if (event.detail.chainId !== "0x38") {
            this.switchToBSCNetwork().then(() => resolve()).catch(reject);
          } else {
            resolve();
          }
        } else {
          console.error("[OnlyBnB] Wallet connection failed:", event.detail.error);
          reject(new Error(event.detail.error));
        }
      };
      window.addEventListener("onlybnb-wallet-response", handleResponse);
      console.log("[OnlyBnB] Dispatching wallet connection request...");
      window.dispatchEvent(new CustomEvent("onlybnb-connect-wallet"));
      setTimeout(() => {
        window.removeEventListener("onlybnb-wallet-response", handleResponse);
        reject(new Error("Wallet connection timeout"));
      }, 30000);
    });
  }
  async switchToBSCNetwork() {
    console.log("[OnlyBnB] Attempting to switch to BSC network...");
    return new Promise((resolve, reject) => {
      const handleResponse = (event) => {
        console.log("[OnlyBnB] Received network switch response:", event.detail);
        window.removeEventListener("onlybnb-network-response", handleResponse);
        if (event.detail.success) {
          console.log("[OnlyBnB] Network switch successful:", event.detail.message);
          resolve();
        } else {
          console.error("[OnlyBnB] Network switch failed:", event.detail.error);
          resolve();
        }
      };
      window.addEventListener("onlybnb-network-response", handleResponse);
      console.log("[OnlyBnB] Dispatching network switch request...");
      window.dispatchEvent(new CustomEvent("onlybnb-switch-network"));
      setTimeout(() => {
        window.removeEventListener("onlybnb-network-response", handleResponse);
        console.warn("[OnlyBnB] Network switch timeout - continuing anyway");
        resolve();
      }, 1e4);
    });
  }
  async fetchTokenBalances() {
    console.log("[OnlyBnB] Fetching token balances...");
    return new Promise((resolve, reject) => {
      const handleResponse = (event) => {
        console.log("[OnlyBnB] Received balances response:", event.detail);
        window.removeEventListener("onlybnb-balances-response", handleResponse);
        if (event.detail.success) {
          resolve(event.detail.balances);
        } else {
          console.error("[OnlyBnB] Balance fetch failed:", event.detail.error);
          resolve({ BNB: "0.0000", ETH: "0.0000", USDT: "0.0000", USDC: "0.0000" });
        }
      };
      window.addEventListener("onlybnb-balances-response", handleResponse);
      console.log("[OnlyBnB] Dispatching balance fetch request...");
      window.dispatchEvent(new CustomEvent("onlybnb-fetch-balances"));
      setTimeout(() => {
        window.removeEventListener("onlybnb-balances-response", handleResponse);
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
          console.log("[OnlyBnB] Found confirm button with selector:", selector);
          break;
        }
      } catch (e) {
        console.debug("[OnlyBnB] Error with selector:", selector, e);
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
    console.log("[OnlyBnB] Found Confirm and pay button, replacing...");
    this.originalConfirmPayButton = confirmButton;
    confirmButton.style.display = "none";
    confirmButton.setAttribute("data-onlybnb-hidden", "true");
    this.payButtonReplaced = true;
    console.log("[OnlyBnB] Confirm and pay button replaced with crypto button");
  }
  restoreConfirmPayButton() {
    if (!this.payButtonReplaced || !this.originalConfirmPayButton || !this.cryptoPayButton) {
      return;
    }
    console.log("[OnlyBnB] Restoring original confirm and pay button...");
    this.originalConfirmPayButton.style.display = "";
    this.cryptoPayButton.remove();
    this.cryptoPayButton = null;
    this.payButtonReplaced = false;
    console.log("[OnlyBnB] Original button restored");
  }
  async handleCryptoPayment() {
    console.log("[OnlyBnB] Starting crypto payment flow...");
    try {
      const isConnected = await this.checkWalletConnection();
      if (!isConnected) {
        console.log("[OnlyBnB] Wallet not connected, connecting...");
        await this.connectWallet();
      }
      const calculation = await this.calculateBNBAmount();
      console.log("[OnlyBnB] Payment calculation:", calculation);
      if (!this.connectedAccount) {
        const accounts = await new Promise((resolve) => {
          window.addEventListener("onlybnb-wallet-response", (event) => {
            if (event.detail.success) {
              resolve([event.detail.account]);
            } else {
              resolve([]);
            }
          }, { once: true });
          window.dispatchEvent(new CustomEvent("onlybnb-connect-wallet"));
        });
        if (accounts.length > 0) {
          this.connectedAccount = accounts[0];
        } else {
          throw new Error("No wallet connected");
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
    console.log("[OnlyBnB] Creating connected wallet UI...");
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

    // ============================================================================
    // CRYPTO PAYMENT UI
    // ============================================================================

    private async showCryptoPaymentOptions(paymentSection: HTMLElement): Promise<void> {
        // Store original content if not already stored
        if (!paymentSection.dataset.originalContent) {
            paymentSection.dataset.originalContent = paymentSection.innerHTML;
        }
      }).catch((error) => {
        console.error("[OnlyBnB] Failed to fetch balances:", error);
        const needsText = `Needs: ${calculation.bnbAmount} BNB`;
        tokenBalance.textContent = needsText;
      });
    }).catch((error) => {
      console.error("[OnlyBnB] Failed to calculate BNB amount:", error);
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
    tokenOptions.className = "onlybnb-token-options";
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
      { symbol: "BNB", name: "Binance Token", icon: "B", color: "#F0B90B", address: "0xbb4CdB9Bd36B01bD1cBaEBF2De08d9173bc095c", enabled: true },
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
        tokenIcon.textContent = token.icon;
        tokenIcon.style.background = token.color;
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
    paymentSummary.className = "onlybnb-payment-summary";
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
                        <span style="color: #F0B90B;">${calculation.bnbAmount} BNB</span>
                    </div>
                `;
        }
      }).catch((error) => {
        console.error("[OnlyBnB] Failed to calculate payment summary:", error);
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
                        <span style="color: #F0B90B;">0.2084 BNB</span>
                    </div>
                `;
        }
      }).catch((error) => {
        console.error("[OnlyBnB] Failed to calculate payment summary:", error);
        const summaryElement = paymentSummary.querySelector("#payment-calculation");
        if (summaryElement) {
          summaryElement.innerHTML = `
                    <div style="color: #666; text-align: center;">
                        Failed to calculate payment. Using demo values:<br>
                        <strong style="color: #F0B90B;">0.2084 BNB for 125.12 SGD</strong>
                    </div>
                `;
        }
      });
    }, 1500);
    const payButton = document.createElement("button");
    payButton.style.cssText = `
            width: 100%;
            background: #F0B90B;
            color: #000;
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
      payButton.style.background = "#E5A50A";
    });
    payButton.addEventListener("mouseleave", () => {
      payButton.style.background = "#F0B90B";
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
        console.error("[OnlyBnB] Payment failed:", error);
        payButton.disabled = false;
        payButton.innerHTML = `
                    <span style="font-size: 20px;">\u20BF</span>
                    Pay with Crypto
                `;
        payButton.style.background = "#F0B90B";
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
    console.log("[OnlyBnB] Crypto payment options hidden, original payment section restored");
  }
  async fetchBNBPrice() {
    console.log("[OnlyBnB] Fetching BNB price...");
    return new Promise((resolve, reject) => {
      const handleResponse = (event) => {
        console.log("[OnlyBnB] Received BNB price response:", event.detail);
        window.removeEventListener("onlybnb-price-response", handleResponse);
        if (event.detail.success) {
          resolve(event.detail.prices);
        } else {
          console.error("[OnlyBnB] BNB price fetch failed, using fallback:", event.detail.error);
          resolve(event.detail.prices);
        }
      };
      window.addEventListener("onlybnb-price-response", handleResponse);
      console.log("[OnlyBnB] Dispatching BNB price fetch request...");
      window.dispatchEvent(new CustomEvent("onlybnb-fetch-bnb-price"));
      setTimeout(() => {
        window.removeEventListener("onlybnb-price-response", handleResponse);
        console.log("[OnlyBnB] BNB price fetch timeout, using fallback prices");
        resolve({ usd: 600, sgd: 810 });
      }, 3000);
    });
  }
  extractTotalPrice() {
    console.log("[OnlyBnB] Extracting booking price from page...");
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
    console.log("[OnlyBnB] Extracted price:", totalPrice, currency);
    return { amount: totalPrice || 125.12, currency: currency.toUpperCase() };
  }
  async calculateBNBAmount() {
    try {
      const totalPrice = this.extractTotalPrice();
      console.log("[OnlyBnB] Total booking price:", totalPrice);
      const bnbPrices = await this.fetchBNBPrice();
      console.log("[OnlyBnB] BNB prices:", bnbPrices);
      const exchangeRate = totalPrice.currency === "SGD" ? bnbPrices.sgd : bnbPrices.usd;
      const bnbAmount = (totalPrice.amount / exchangeRate).toFixed(6);
      console.log("[OnlyBnB] Calculated BNB amount:", {
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
      console.error("[OnlyBnB] Error calculating BNB amount:", error);
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
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            max-width: 300px;
        `;
    successMessage.innerHTML = `
            \u2705 Payment Successful!<br>
            <small style="opacity: 0.9;">Your BNB payment has been processed</small>
        `;
    document.body.appendChild(successMessage);
    setTimeout(() => {
      successMessage.remove();
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
    injector = new OnlyBnBInjector;
  });
} else {
  injector = new OnlyBnBInjector;
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PAYMENT_COMPLETE" || request.type === "PAYMENT_CONFIRMED") {
    console.log("[OnlyBnB] Payment completed successfully");
    const successMessage = document.createElement("div");
    successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
        `;
    successMessage.innerHTML = "\u2713 Crypto payment successful!<br><small>Completing your booking...</small>";
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
