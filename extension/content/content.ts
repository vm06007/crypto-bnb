// Content script for OnlyBnB - Injects "Pay with BNB" button on Airbnb checkout

interface PaymentData {
    amount: string;
    currency: string;
    bookingId?: string;
}

class OnlyBnBInjector {
    private observer: MutationObserver | null = null;
    private buttonInjected = false;
    private checkoutDetected = false;

    constructor() {
        this.init();
    }

    private init(): void {
        console.log('[OnlyBnB] Extension initialized on:', window.location.href);
        // Start observing for checkout page
        this.observePageChanges();
        // Check if we're already on checkout
        this.checkForCheckoutPage();

        // Also check periodically in case dynamic content loads
        setInterval(() => {
            if (!this.buttonInjected) {
                this.checkForCheckoutPage();
            }
        }, 2000);
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

    private injectIntoPaymentDropdown(): void {
        console.log('[OnlyBnB] Looking for payment dropdown...');

        // Look for the payment method select/dropdown
        const dropdownSelectors = [
            'select[name="paymentMethod"]',
            'select[aria-label*="payment"]',
            'div[aria-haspopup="listbox"][aria-label*="Pay with"]',
            'button[aria-haspopup="listbox"][aria-label*="Pay with"]',
            'div[role="combobox"]',
            'button[aria-expanded]',
            '[data-testid="payment-method-selector"]',
            // More specific selectors for current Airbnb UI
            'div[class*="payment-method"]',
            'button[class*="payment-method"]',
            '[data-testid="structured-search-input-field-split-dates-0"]',
            'div[class*="_1nihvshi"]', // Common Airbnb class pattern
        ];

        let paymentDropdown: Element | null = null;
        for (const selector of dropdownSelectors) {
            paymentDropdown = document.querySelector(selector);
            if (paymentDropdown) {
                console.log('[OnlyBnB] Found payment dropdown:', selector);
                break;
            }
        }

        if (!paymentDropdown) {
            console.log('[OnlyBnB] Payment dropdown not found');
            return;
        }

        // If it's a select element, add an option
        if (paymentDropdown.tagName === 'SELECT') {
            const select = paymentDropdown as HTMLSelectElement;

            // Check if we already added the option
            if (Array.from(select.options).some(opt => opt.value === 'onlybnb-crypto')) {
                return;
            }

            const cryptoOption = document.createElement('option');
            cryptoOption.value = 'onlybnb-crypto';
            cryptoOption.textContent = '💰 Pay with BNB or Crypto';
            cryptoOption.style.cssText = 'font-weight: 600; color: #F0B90B;';

            // Insert after the first option (usually the default card)
            if (select.options.length > 0) {
                select.insertBefore(cryptoOption, select.options[1]);
            } else {
                select.appendChild(cryptoOption);
            }

            // Listen for selection
            select.addEventListener('change', (e) => {
                if ((e.target as HTMLSelectElement).value === 'onlybnb-crypto') {
                    e.preventDefault();
                    const paymentData = this.extractPaymentData();
                    if (paymentData) {
                        this.handlePayWithBNB(paymentData);
                    }
                }
            });
        } else {
            // For custom dropdowns, we need to observe clicks and inject when opened
            this.observeCustomDropdown(paymentDropdown);
        }
    }

    private observeCustomDropdown(dropdown: Element): void {
        // Add click listener to the dropdown trigger
        dropdown.addEventListener('click', () => {
            console.log('[OnlyBnB] Dropdown clicked, waiting for menu...');

            // Wait a bit for the dropdown menu to appear
            setTimeout(() => {
                this.injectIntoDropdownMenu();
            }, 100);
        });

        // Also observe for aria-expanded changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
                    const target = mutation.target as HTMLElement;
                    if (target.getAttribute('aria-expanded') === 'true') {
                        setTimeout(() => {
                            this.injectIntoDropdownMenu();
                        }, 100);
                    }
                }
            });
        });

        observer.observe(dropdown, { attributes: true });
    }

    private injectIntoDropdownMenu(): void {
        // Look for the dropdown menu items
        const menuSelectors = [
            '[role="listbox"]',
            '[role="menu"]',
            'ul[aria-label*="payment"]',
            'div[data-testid*="payment-options"]',
            '.payment-method-list',
        ];

        let menu: Element | null = null;
        for (const selector of menuSelectors) {
            menu = document.querySelector(selector);
            if (menu) break;
        }

        if (!menu) {
            console.log('[OnlyBnB] Dropdown menu not found');
            return;
        }

        // Check if we already added our option
        if (menu.querySelector('.onlybnb-payment-option-menu')) {
            return;
        }

        // Find existing payment options to match the style
        const existingOption = menu.querySelector('[role="option"], li, [role="menuitem"]');
        if (!existingOption) return;

        // Create our crypto payment option
        const cryptoOption = existingOption.cloneNode(true) as HTMLElement;
        cryptoOption.className = existingOption.className + ' onlybnb-payment-option-menu';
        cryptoOption.setAttribute('data-onlybnb', 'true');

        // Make sure it has the same role and attributes
        if (existingOption.getAttribute('role')) {
            cryptoOption.setAttribute('role', existingOption.getAttribute('role')!);
        }
        if (existingOption.getAttribute('tabindex')) {
            cryptoOption.setAttribute('tabindex', existingOption.getAttribute('tabindex')!);
        }

        // Update the content - find the deepest text element
        const findAndUpdateText = (element: Element) => {
            // Look for Mastercard image and replace with emoji
            const img = element.querySelector('img[alt*="Mastercard"], img[src*="mastercard"]');
            if (img) {
                const emojiSpan = document.createElement('span');
                emojiSpan.textContent = '💰';
                emojiSpan.style.fontSize = '24px';
                img.replaceWith(emojiSpan);
            }

            // Update text content
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null
            );

            let node;
            let textUpdated = false;
            while (node = walker.nextNode()) {
                if (node.textContent && node.textContent.trim()) {
                    if (node.textContent.includes('Mastercard') && !textUpdated) {
                        node.textContent = 'Pay with BNB or Crypto';
                        textUpdated = true;
                    } else if (node.textContent.includes('1338')) {
                        node.textContent = '';
                    }
                }
            }

            // Add NEW badge only if crypto is not selected
            const isCryptoSelected = sessionStorage.getItem('onlybnb-selected') === 'true';
            if (!isCryptoSelected) {
                /*const badge = document.createElement('span');
                badge.className = 'onlybnb-new-badge';
                badge.textContent = 'NEW';
                badge.style.cssText = `
                    background: #F0B90B;
                    color: #000;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    margin-left: auto;
                    margin-right: 12px;
                `;*/

                // Find a good place to insert the badge
                const textContainer = element.querySelector('div[dir="ltr"], span:not(:empty)');
                if (textContainer && textContainer.parentElement) {
                    textContainer.parentElement.style.display = 'flex';
                    textContainer.parentElement.style.alignItems = 'center';
                    // textContainer.parentElement.appendChild(badge);
                }
            }
        };

        findAndUpdateText(cryptoOption);

        // Style adjustments
        cryptoOption.style.cssText = `
            cursor: pointer;
            transition: background-color 0.2s ease;
        `;

        // Add hover effect only when not selected
        cryptoOption.addEventListener('mouseenter', () => {
            if (cryptoOption.getAttribute('aria-selected') !== 'true') {
                cryptoOption.style.backgroundColor = '#FFF8E7';
            }
        });

        cryptoOption.addEventListener('mouseleave', () => {
            if (cryptoOption.getAttribute('aria-selected') !== 'true') {
                cryptoOption.style.backgroundColor = '';
            }
        });

        // Add click handler
        cryptoOption.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            console.log('[OnlyBnB] Crypto payment option clicked!');

            // Store that crypto option is selected
            sessionStorage.setItem('onlybnb-selected', 'true');

            // Find all possible dropdown triggers
            const dropdownTriggers = [
                document.querySelector('button[aria-haspopup="listbox"]'),
                document.querySelector('div[role="combobox"] button'),
                document.querySelector('[data-testid*="payment-option-selector"]'),
                // Look for the button that contains Mastercard text
                Array.from(document.querySelectorAll('button')).find(btn =>
                    btn.textContent?.includes('Mastercard')
                )
            ].filter(Boolean);

            const dropdownTrigger = dropdownTriggers[0] as HTMLElement;

            if (dropdownTrigger) {
                console.log('[OnlyBnB] Found dropdown trigger:', dropdownTrigger);

                // Method 1: Try to simulate Airbnb's native selection behavior
                // First close the dropdown
                setTimeout(() => {
                    dropdownTrigger.click();
                }, 50);

                // Then update the display after dropdown closes
                setTimeout(() => {
                    // Find all elements that might contain the payment method display
                    const displayContainers = [
                        dropdownTrigger.querySelector('span:not(:empty)'),
                        dropdownTrigger.querySelector('div[dir]'),
                        dropdownTrigger.querySelector('[class*="payment"]'),
                        dropdownTrigger
                    ].filter(Boolean);

                    // Update each container
                    displayContainers.forEach(container => {
                        if (!container) return;

                        // Find image and replace with emoji
                        const imgs = container.querySelectorAll('img');
                        imgs.forEach(img => {
                            if (img.alt?.includes('Mastercard') || img.src?.includes('mastercard')) {
                                const emoji = document.createElement('span');
                                emoji.textContent = '💰';
                                emoji.style.cssText = 'font-size: 24px; margin-right: 8px;';
                                img.replaceWith(emoji);
                            }
                        });

                        // Update all text nodes
                        const walker = document.createTreeWalker(
                            container,
                            NodeFilter.SHOW_TEXT,
                            {
                                acceptNode: (node) => {
                                    return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                                }
                            }
                        );

                        let node;
                        while (node = walker.nextNode()) {
                            if (node.textContent?.includes('Mastercard')) {
                                node.textContent = node.textContent.replace('Mastercard', 'Pay with BNB or Crypto');
                            }
                            if (node.textContent?.includes('1338')) {
                                node.textContent = node.textContent.replace('1338', '');
                            }
                        }
                    });

                    // Also try a more aggressive approach - completely replace the button content
                    if (!dropdownTrigger.textContent?.includes('Pay with BNB')) {
                        console.log('[OnlyBnB] Aggressive update - replacing button content');
                        const currentContent = dropdownTrigger.innerHTML;
                        const newContent = currentContent
                            .replace(/Mastercard/g, 'Pay with BNB or Crypto')
                            .replace(/1338/g, '')
                            .replace(/<img[^>]*alt="Mastercard"[^>]*>/g, '<span style="font-size: 24px; margin-right: 8px;">💰</span>');

                        dropdownTrigger.innerHTML = newContent;
                    }
                }, 150);

                // First, clear ALL backgrounds to ensure only one has gray
                const allOptions = document.querySelectorAll('[role="option"]');
                allOptions.forEach(option => {
                    (option as HTMLElement).style.backgroundColor = '';
                    const childDivs = option.querySelectorAll('div');
                    childDivs.forEach(div => {
                        (div as HTMLElement).style.backgroundColor = '';
                    });
                });

                // Now update states
                allOptions.forEach(option => {
                    if (option === cryptoOption) {
                        // Mark crypto option as selected with gray background
                        option.setAttribute('aria-selected', 'true');
                        (option as HTMLElement).style.backgroundColor = '#f0f0f0';

                        // Show checkmark
                        const svgs = option.querySelectorAll('svg');
                        svgs.forEach(svg => {
                            if (svg.getAttribute('aria-label')?.includes('Selected') ||
                                svg.getAttribute('aria-hidden') === 'true') {
                                svg.style.display = 'block';
                                svg.style.visibility = 'visible';
                                svg.style.opacity = '1';
                            }
                        });

                        // Remove NEW badge if it exists
                        const badge = option.querySelector('.onlybnb-new-badge');
                        if (badge) {
                            badge.remove();
                        }
                    } else {
                        // Unselect all other options - no gray background
                        option.setAttribute('aria-selected', 'false');
                        option.classList.remove('selected');
                        (option as HTMLElement).style.backgroundColor = ''; // Remove gray background

                        // Hide checkmarks
                        const svgs = option.querySelectorAll('svg');
                        svgs.forEach(svg => {
                            svg.style.display = 'none';
                            svg.style.visibility = 'hidden';
                            svg.style.opacity = '0';
                        });
                    }
                });

                // Close the dropdown after a small delay
                setTimeout(() => {
                    dropdownTrigger.click();
                }, 100);
            }

            // Wait a bit then show payment flow
            setTimeout(() => {
                const paymentData = this.extractPaymentData();
                if (paymentData) {
                    this.handlePayWithBNB(paymentData);
                }
            }, 500);
        });

        // Insert at the beginning of the menu
        menu.insertBefore(cryptoOption, menu.firstChild);

        // Add click handlers to other options to deselect crypto
        const otherOptions = menu.querySelectorAll('[role="option"]:not(:last-child)');
        otherOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Clear crypto selection
                sessionStorage.removeItem('onlybnb-selected');

                // Add NEW badge back to crypto option since it's no longer selected
                const existingBadge = cryptoOption.querySelector('.onlybnb-new-badge');
                if (!existingBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'onlybnb-new-badge';
                    badge.textContent = 'NEW';
                    badge.style.cssText = `
                        background: #F0B90B;
                        color: #000;
                        font-size: 10px;
                        font-weight: 700;
                        padding: 2px 6px;
                        border-radius: 4px;
                        text-transform: uppercase;
                        margin-left: auto;
                        margin-right: 12px;
                    `;

                    const textContainer = cryptoOption.querySelector('div[dir="ltr"], span:not(:empty)');
                    if (textContainer && textContainer.parentElement) {
                        textContainer.parentElement.style.display = 'flex';
                        textContainer.parentElement.style.alignItems = 'center';
                        textContainer.parentElement.appendChild(badge);
                    }
                }

                // Update crypto option's selected state
                cryptoOption.setAttribute('aria-selected', 'false');
                cryptoOption.style.backgroundColor = '';

                // Hide crypto checkmark
                const cryptoCheckmark = cryptoOption.querySelector('svg');
                if (cryptoCheckmark) {
                    (cryptoCheckmark as unknown as HTMLElement).style.display = 'none';
                    (cryptoCheckmark as unknown as HTMLElement).style.visibility = 'hidden';
                }
            });
        });

        // Update visual states based on current selection
        const updateSelectionStates = () => {
            const isCryptoSelected = sessionStorage.getItem('onlybnb-selected') === 'true';

            // First, clear ALL backgrounds to ensure only one item has gray background
            const allOptions = menu.querySelectorAll('[role="option"]');
            allOptions.forEach(option => {
                (option as HTMLElement).style.backgroundColor = '';
                // Also clear any inline background styles on child elements
                const childDivs = option.querySelectorAll('div');
                childDivs.forEach(div => {
                    (div as HTMLElement).style.backgroundColor = '';
                });
            });

            // Find which option is currently selected by Airbnb
            let defaultSelectedOption = null;
            otherOptions.forEach(option => {
                if (option.getAttribute('aria-selected') === 'true') {
                    defaultSelectedOption = option;
                }
            });

            if (isCryptoSelected) {
                // Crypto is selected - override Airbnb's selection
                cryptoOption.setAttribute('aria-selected', 'true');
                cryptoOption.style.backgroundColor = '#f0f0f0';

                // Show checkmark
                const cryptoCheckmark = cryptoOption.querySelector('svg');
                if (cryptoCheckmark) {
                    (cryptoCheckmark as unknown as HTMLElement).style.display = 'block';
                    (cryptoCheckmark as unknown as HTMLElement).style.visibility = 'visible';
                    (cryptoCheckmark as unknown as HTMLElement).style.opacity = '1';
                }

                // Remove NEW badge
                const badge = cryptoOption.querySelector('.onlybnb-new-badge');
                if (badge) {
                    badge.remove();
                }

                // Explicitly unselect all other options
                otherOptions.forEach(option => {
                    option.setAttribute('aria-selected', 'false');
                    (option as HTMLElement).style.backgroundColor = ''; // Remove gray background

                    // Hide checkmarks
                    const checkmark = option.querySelector('svg');
                    if (checkmark) {
                        (checkmark as unknown as HTMLElement).style.display = 'none';
                        (checkmark as unknown as HTMLElement).style.visibility = 'hidden';
                    }
                });
            } else {
                // Crypto is not selected
                cryptoOption.setAttribute('aria-selected', 'false');

                // Hide crypto checkmark
                const cryptoCheckmark = cryptoOption.querySelector('svg');
                if (cryptoCheckmark) {
                    (cryptoCheckmark as unknown as HTMLElement).style.display = 'none';
                    (cryptoCheckmark as unknown as HTMLElement).style.visibility = 'hidden';
                }

                // Apply gray background ONLY to the default selected option
                if (defaultSelectedOption) {
                    (defaultSelectedOption as HTMLElement).style.backgroundColor = '#f0f0f0';
                    const checkmark = (defaultSelectedOption as Element).querySelector('svg');
                    if (checkmark) {
                        (checkmark as unknown as HTMLElement).style.display = 'block';
                        (checkmark as unknown as HTMLElement).style.visibility = 'visible';
                    }
                }

                // Remove gray background from crypto option when not selected
                cryptoOption.style.backgroundColor = '';
            }
        };

        // Apply current state
        updateSelectionStates();

        console.log('[OnlyBnB] Crypto payment option added to dropdown menu');
    }

    private checkForCheckoutPage(): void {
        // First check URL pattern
        const isBookingUrl = window.location.pathname.includes('/book/');
        if (isBookingUrl) {
            console.log('[OnlyBnB] Detected booking URL, looking for checkout elements...');
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
            this.checkoutDetected = true;
            // Try to inject into payment dropdown first
            this.injectIntoPaymentDropdown();
            // Also inject the standalone button as fallback
            this.injectPayWithBNBButton();
        }
    }

    private injectPayWithBNBButton(): void {
        // Find payment method section
        const paymentSelectors = [
            '[data-testid="payment-methods"]',
            '[data-testid="payment-selection"]',
            'div[aria-label*="Payment"]',
            'div[class*="payment-methods"]',
            'div[class*="payment-options"]',
            'form[method="post"]',
            // More specific selectors for current page
            'section:has(h2:contains("Pay with"))',
            'section:has(h3:contains("Pay with"))',
            'div:has(> div > h2:contains("Pay with"))',
            'div:has(> div > h3:contains("Pay with"))',
            // Look for the Mastercard dropdown area
            'div:has(select option[value*="Mastercard"])',
            'div:has(button:contains("Mastercard"))',
        ];

        let paymentSection: Element | null = null;

        // First try specific selectors
        for (const selector of paymentSelectors) {
            try {
                paymentSection = document.querySelector(selector);
                if (paymentSection) break;
            } catch (e) {
                // Handle complex selectors that might fail
            }
        }

        // If not found, look for "Pay with" heading and inject near it
        if (!paymentSection) {
            const headings = document.querySelectorAll('h2, h3, h4');
            for (const heading of headings) {
                if (heading.textContent?.toLowerCase().includes('pay with')) {
                    paymentSection = heading.closest('section') || heading.parentElement;
                    console.log('[OnlyBnB] Found payment section via heading:', heading.textContent);
                    break;
                }
            }
        }

        // Last resort: find the Mastercard dropdown
        if (!paymentSection) {
            const mastercardElements = Array.from(document.querySelectorAll('*')).filter(el =>
                el.textContent?.includes('Mastercard 1338')
            );
            if (mastercardElements.length > 0) {
                paymentSection = mastercardElements[0].closest('section') || mastercardElements[0].parentElement;
                console.log('[OnlyBnB] Found payment section via Mastercard element');
            }
        }

        if (!paymentSection) {
            console.log('[OnlyBnB] Payment section not found, retrying...');
            setTimeout(() => this.injectPayWithBNBButton(), 1000);
            return;
        }

        // Extract payment amount
        const paymentData = this.extractPaymentData();
        if (!paymentData) {
            console.error('[OnlyBnB] Could not extract payment data');
            return;
        }

        // Create the OnlyBnB button container
        const buttonContainer = this.createPayWithBNBButton(paymentData);

        // Try multiple injection strategies
        let injected = false;

        // Strategy 1: Insert before submit button
        const submitButton = paymentSection.querySelector('button[type="submit"]');
        if (submitButton && submitButton.parentElement) {
            submitButton.parentElement.insertBefore(buttonContainer, submitButton);
            injected = true;
        }

        // Strategy 2: Insert after the payment dropdown
        if (!injected) {
            const dropdownContainer = paymentSection.querySelector('div:has(select), div:has(button[aria-haspopup])');
            if (dropdownContainer && dropdownContainer.parentElement) {
                dropdownContainer.parentElement.insertBefore(buttonContainer, dropdownContainer.nextSibling);
                injected = true;
            }
        }

        // Strategy 3: Find "Pay with" section and insert after
        if (!injected) {
            const payWithHeader = Array.from(paymentSection.querySelectorAll('h2, h3')).find(h =>
                h.textContent?.toLowerCase().includes('pay with')
            );
            if (payWithHeader && payWithHeader.parentElement) {
                payWithHeader.parentElement.appendChild(buttonContainer);
                injected = true;
            }
        }

        // Strategy 4: Just append to payment section
        if (!injected) {
            paymentSection.appendChild(buttonContainer);
            injected = true;
        }

        this.buttonInjected = true;
        console.log('[OnlyBnB] Pay with BNB button injected successfully at:', paymentSection);
    }

    private extractPaymentData(): PaymentData | null {
        // Try multiple selectors to find the total amount
        const amountSelectors = [
            '[data-testid="book-it-default"] span:has-text("Total")',
            'span:has-text("Total") + span',
            'div[class*="total"] span[class*="price"]',
            'span[class*="_total"]',
            'div[aria-label*="Total"] span',
            '*:has-text("S$"):not(:has(*))', // Leaf nodes with currency
            '*:has-text("$"):not(:has(*))',
            '*:has-text("€"):not(:has(*))',
            '*:has-text("£"):not(:has(*))',
        ];

        let totalAmount: string | null = null;
        let currency = 'USD'; // Default currency

        for (const selector of amountSelectors) {
            try {
                const elements = selector.includes('has-text')
                    ? this.findElementsByText(selector)
                    : document.querySelectorAll(selector);

                for (const element of elements) {
                    const text = element.textContent?.trim() || '';
                    const amountMatch = text.match(/([A-Z$€£¥₹]+)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);

                    if (amountMatch && parseFloat(amountMatch[2].replace(/,/g, '')) > 100) {
                        totalAmount = amountMatch[2];
                        if (amountMatch[1]) {
                            currency = this.normalizeCurrency(amountMatch[1]);
                        }
                        break;
                    }
                }
                if (totalAmount) break;
            } catch (e) {
                console.debug('[OnlyBnB] Error with selector:', selector, e);
            }
        }

        if (!totalAmount) {
            console.error('[OnlyBnB] Could not find total amount');
            return null;
        }

        return {
            amount: totalAmount.replace(/,/g, ''),
            currency: currency,
        };
    }

    private findElementsByText(selector: string): Element[] {
        const match = selector.match(/^(.*?):has-text\("(.+)"\)$/);
        if (!match) return [];

        const [, elementSelector, text] = match;
        const elements = document.querySelectorAll(elementSelector || '*');

        return Array.from(elements).filter(el =>
            el.textContent?.toLowerCase().includes(text.toLowerCase())
        );
    }

    private normalizeCurrency(symbol: string): string {
        const currencyMap: Record<string, string> = {
            '$': 'USD',
            'S$': 'SGD',
            '€': 'EUR',
            '£': 'GBP',
            '¥': 'JPY',
            '₹': 'INR',
            'USD': 'USD',
            'SGD': 'SGD',
            'EUR': 'EUR',
            'GBP': 'GBP',
        };
        return currencyMap[symbol] || 'USD';
    }

    private createPayWithBNBButton(paymentData: PaymentData): HTMLElement {
        const container = document.createElement('div');
        container.className = 'onlybnb-payment-option';
        container.style.cssText = `
            margin: 16px 0;
            padding: 16px;
            border: 2px solid #F0B90B;
            border-radius: 12px;
            background: linear-gradient(135deg, #FFF8E7 0%, #FFFDF8 100%);
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        const button = document.createElement('button');
        button.className = 'onlybnb-pay-button';
        button.style.cssText = `
            width: 100%;
            padding: 14px 24px;
            background: #F0B90B;
            color: #000;
            font-weight: 600;
            font-size: 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.2s ease;
        `;

        // BNB Logo
        const logo = document.createElement('img');
        logo.src = chrome.runtime.getURL('assets/bnb-logo.svg');
        logo.style.cssText = 'width: 24px; height: 24px;';
        logo.onerror = () => {
            // Fallback to text if logo fails
            logo.style.display = 'none';
        };

        const buttonText = document.createElement('span');
        buttonText.textContent = `Pay with BNB — OnlyBNB`;

        const amountText = document.createElement('div');
        amountText.style.cssText = `
            font-size: 14px;
            color: #666;
            margin-top: 8px;
            text-align: center;
        `;
        amountText.textContent = `Total: ${paymentData.currency} ${paymentData.amount}`;

        button.appendChild(logo);
        button.appendChild(buttonText);

        container.appendChild(button);
        container.appendChild(amountText);

        // Hover effects
        container.addEventListener('mouseenter', () => {
            container.style.transform = 'translateY(-2px)';
            container.style.boxShadow = '0 4px 12px rgba(240, 185, 11, 0.3)';
        });

        container.addEventListener('mouseleave', () => {
            container.style.transform = 'translateY(0)';
            container.style.boxShadow = 'none';
        });

        // Click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handlePayWithBNB(paymentData);
        });

        return container;
    }

    private handlePayWithBNB(paymentData: PaymentData): void {
        console.log('[OnlyBnB] Initiating BNB payment:', paymentData);

        // Send message to background script to open popup
        chrome.runtime.sendMessage({
            type: 'INITIATE_BNB_PAYMENT',
            data: {
                ...paymentData,
                url: window.location.href,
                timestamp: Date.now(),
            },
        });
    }

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
    if (request.type === 'PAYMENT_COMPLETE') {
        // Handle successful payment
        console.log('[OnlyBnB] Payment completed successfully');

        // Show success message
        const successMessage = document.createElement('div');
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
        successMessage.textContent = '✓ OnlyBNB card added successfully!';
        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.remove();
            // Reload the page to show the new payment method
            window.location.reload();
        }, 3000);

        sendResponse({ success: true });
    }

    return true; // Keep the message channel open
});
