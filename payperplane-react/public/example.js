(function() {
    'use strict';

    // Setup crypto payment flow animation for the floating browser
    function setupCryptoPaymentFlow() {
        // Get the crypto flow container for mobile mockup
        const cryptoFlowMobile = document.getElementById('cryptoFlowMobile');
        const step1Mobile = document.getElementById('step1Mobile');
        const step2Mobile = document.getElementById('step2Mobile');
        const step3Mobile = document.getElementById('step3Mobile');

        // Get all connect wallet buttons in the mobile mockup
        const connectBtns = cryptoFlowMobile ? cryptoFlowMobile.querySelectorAll('.connect-wallet-btn') : [];
        const payBtn = cryptoFlowMobile ? cryptoFlowMobile.querySelector('.pay-crypto-btn') : null;

        // Handle wallet connection
        connectBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();

                // Add connecting animation
                const originalText = this.innerHTML;
                this.innerHTML = '<div class="random-spinner" style="width: 16px; height: 16px; margin-right: 8px; display: inline-block; vertical-align: middle;"></div> Connecting...';
                this.disabled = true;

                setTimeout(() => {
                    // Hide step 1 and show step 2
                    step1Mobile.classList.add('hidden');
                    step2Mobile.classList.remove('hidden');

                    // Animate amount appearance
                    const amount = step2Mobile.querySelector('.amount');
                    if (amount) {
                        amount.style.transform = 'scale(0)';
                        amount.style.transition = 'transform 0.5s ease';
                        setTimeout(() => {
                            amount.style.transform = 'scale(1)';
                        }, 100);
                    }

                    // Reset button for next demo
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 1500);
            });
        });

        // Handle payment
        if (payBtn) {
            payBtn.addEventListener('click', function(e) {
                e.preventDefault();

                // Add processing animation
                const originalText = this.innerHTML;
                this.innerHTML = '<div class="random-spinner" style="width: 16px; height: 16px; margin-right: 8px; display: inline-block; vertical-align: middle;"></div> Processing...';
                this.disabled = true;

                setTimeout(() => {
                    // Hide step 2 and show step 3
                    step2Mobile.classList.add('hidden');
                    step3Mobile.classList.remove('hidden');

                    // Success animation
                    const successIcon = step3Mobile.querySelector('.success-icon');
                    if (successIcon) {
                        successIcon.style.transform = 'scale(0)';
                        successIcon.style.transition = 'transform 0.5s ease';
                        setTimeout(() => {
                            successIcon.style.transform = 'scale(1)';
                        }, 100);
                    }

                    // Reset after showing success
                    setTimeout(() => {
                        // Reset flow for demo
                        step3Mobile.classList.add('hidden');
                        step1Mobile.classList.remove('hidden');

                        // Reset buttons
                        connectBtns.forEach(btn => {
                            btn.disabled = false;
                        });

                        this.innerHTML = originalText;
                        this.disabled = false;
                    }, 3000);
                }, 2000);
            });
        }

        // Auto-demo the flow
        function runDemo() {
            // Check if we're not already in a demo
            if (step1Mobile && !step1Mobile.classList.contains('hidden')) {
                setTimeout(() => {
                    const metaMaskBtn = cryptoFlowMobile.querySelector('.connect-wallet-btn:not(.secondary)');
                    if (metaMaskBtn && !metaMaskBtn.disabled) {
                        metaMaskBtn.click();

                        setTimeout(() => {
                            if (payBtn && !payBtn.disabled && !step2Mobile.classList.contains('hidden')) {
                                payBtn.click();
                            }
                        }, 3000);
                    }
                }, 5000);
            }
        }

        // Run demo on page load
        runDemo();

        // Repeat demo every 15 seconds
        setInterval(runDemo, 15000);
    }

    // Add floating effect to the browser mockup
    function setupFloatingAnimation() {
        const mobileMockup = document.getElementById('mobile-mockup');
        if (mobileMockup) {
            // Add floating animation
            let floatDirection = 1;
            let currentY = 0;

            setInterval(() => {
                currentY += floatDirection * 0.5;
                if (currentY > 20 || currentY < -20) {
                    floatDirection *= -1;
                }
                mobileMockup.style.transform = `translate(-50%, calc(-50% + ${currentY}px))`;
            }, 30);
        }
    }

    // Add required CSS animations
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes rotate {
                to {
                    transform: rotate(360deg);
                }
            }

            .random-spinner {
                position: relative;
                border-top: 3px solid #4DB3C1;
                border-bottom: 0;
                border-left: 3px solid #4DB3C1;
                border-right: 3px solid transparent;
                animation: rotate 1.5s linear infinite;
                height: 54px;
                width: 54px;
                border-radius: 50%;
                box-sizing: border-box;
            }

            .random-spinner:before {
                content: '';
                background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 11.6C20 10.96 19.44 10.4 18.8 10.4H14.4L10.4 4H8.8L10.8 10.4H6.4L5.2 8.8H4L4.8 11.6L4 14.4H5.2L6.4 12.8H10.8L8.8 19.2H10.4L14.4 12.8H18.8C19.44 12.8 20 12.24 20 11.6Z' fill='black'/%3E%3C/svg%3E%0A");
                display: block;
                background-size: 55%;
                background-repeat: no-repeat;
                background-position: center;
                position: absolute;
                z-index: 999;
                top: 50%;
                left: 50%;
                width: 100%;
                height: 100%;
                transform: translate(-50%, -50%) rotate(41deg);
            }

            .hidden {
                display: none !important;
            }

            .crypto-payment-flow {
                transition: all 0.3s ease;
            }

            .wallet-connect-step,
            .payment-confirm-step,
            .success-step {
                animation: fadeIn 0.5s ease;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .connect-wallet-btn,
            .pay-crypto-btn {
                transition: all 0.2s ease;
            }

            .connect-wallet-btn:disabled,
            .pay-crypto-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .success-icon {
                display: inline-block;
                transition: transform 0.5s ease;
            }

            .amount {
                display: inline-block;
                transition: transform 0.5s ease;
            }

            /* Smooth floating effect */
            .main-screen-new__mockup {
                transition: transform 0.03s linear;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize all features
    function init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Setup all interactive features
        addAnimationStyles();
        setupCryptoPaymentFlow();
        setupFloatingAnimation();
    }

    // Start initialization
    init();
})();
