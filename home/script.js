
(function() {
    'use strict';

    // DOM elements
    const heroSection = document.querySelector('.HeroSection');
    const payButton = document.querySelector('.PayButton');

    // Crypto payment flow animation
    function setupCryptoPaymentFlow() {
        const cryptoOption = document.querySelector('.crypto-option input');
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');

        // Wallet connect buttons
        const connectBtns = document.querySelectorAll('.connect-wallet-btn');
        const payBtn = document.querySelector('.pay-crypto-btn');

        // Auto-play the flow after 3 seconds
        setTimeout(() => {
            if (cryptoOption) cryptoOption.click();
        }, 3000);

        // Handle wallet connection
        connectBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();

                // Add connecting animation
                this.innerHTML = '<span style="animation: spin 1s linear infinite;">⟳</span> Connecting...';
                this.disabled = true;

                setTimeout(() => {
                    step1.classList.add('hidden');
                    step2.classList.remove('hidden');

                    // Animate amount appearance
                    const amount = document.querySelector('.amount');
                    if (amount) {
                        amount.style.transform = 'scale(0)';
                        setTimeout(() => {
                            amount.style.transition = 'transform 0.5s ease';
                            amount.style.transform = 'scale(1)';
                        }, 100);
                    }
                }, 1500);
            });
        });

        // Handle payment
        if (payBtn) {
            payBtn.addEventListener('click', function(e) {
                e.preventDefault();

                // Add processing animation
                this.innerHTML = '<span style="animation: spin 1s linear infinite;">⟳</span> Processing...';
                this.disabled = true;

                setTimeout(() => {
                    step2.classList.add('hidden');
                    step3.classList.remove('hidden');

                    // Redirect simulation
                    setTimeout(() => {
                        // Reset flow for demo
                        step3.classList.add('hidden');
                        step1.classList.remove('hidden');

                        // Reset buttons
                        connectBtns.forEach(btn => {
                            btn.innerHTML = btn.classList.contains('secondary') ? 'WalletConnect' : 'Connect MetaMask';
                            btn.disabled = false;
                        });

                        payBtn.innerHTML = 'Pay with BNB';
                        payBtn.disabled = false;
                    }, 3000);
                }, 2000);
            });
        }

        // Auto-demo the flow
        function runDemo() {
            setTimeout(() => {
                const metaMaskBtn = document.querySelector('.connect-wallet-btn:not(.secondary)');
                if (metaMaskBtn && !metaMaskBtn.disabled) {
                    metaMaskBtn.click();

                    setTimeout(() => {
                        if (payBtn && !payBtn.disabled) {
                            payBtn.click();
                        }
                    }, 3000);
                }
            }, 5000);
        }

        // Run demo on page load
        runDemo();

        // Repeat demo every 15 seconds
        setInterval(runDemo, 15000);
    }

    // Payment button interaction
    function setupPayButtonAnimation() {
        if (!payButton) return;

        payButton.addEventListener('click', function(e) {
            e.preventDefault();

            // Add loading state
            this.innerHTML = '<span style="animation: spin 1s linear infinite;">⟳</span> Processing...';
            this.disabled = true;
            this.style.background = '#9ca3af';

            // Simulate payment processing
            setTimeout(() => {
                this.innerHTML = '✓ Payment Complete';
                this.style.background = '#10b981';

                // Reset after delay
                setTimeout(() => {
                    this.innerHTML = 'Pay';
                    this.disabled = false;
                    this.style.background = 'var(--purple)';
                }, 2000);
            }, 2000);
        });
    }

    // Notification system
    function showNotification(message) {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 100px;
                right: 30px;
                background: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                border: 1px solid #e5e7eb;
                max-width: 300px;
                z-index: 1001;
                animation: slideInUp 0.3s ease;
            ">
                <div style="font-weight: 600; margin-bottom: 4px;">Stripe Support</div>
                <div style="color: #6b7280; font-size: 14px;">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutDown 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
    }

    // Counter animation for stats
    function setupCounterAnimation() {
        const animateCounter = (element, target, duration = 2000) => {
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = formatNumber(target);
                    clearInterval(timer);
                } else {
                    element.textContent = formatNumber(Math.floor(current));
                }
            }, 16);
        };

        const formatNumber = (num) => {
            if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B+';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
            if (num >= 1000) return (num / 1000).toFixed(0) + 'K+';
            return num.toString();
        };

        // Observe stats section
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const number = entry.target.querySelector('.StatItem-number');
                    const originalText = number.textContent;

                    // Extract number for animation
                    let targetValue = 0;
                    if (originalText.includes('640B+')) targetValue = 640;
                    else if (originalText.includes('135+')) targetValue = 135;
                    else if (originalText.includes('50+')) targetValue = 50;
                    else if (originalText.includes('Millions')) targetValue = 5;

                    if (targetValue > 0) {
                        animateCounter(number, targetValue);
                    }

                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.StatItem').forEach(item => {
            statsObserver.observe(item);
        });
    }

    // Parallax effect for hero section
    function setupParallaxEffect() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroBackground = document.querySelector('.HeroSection');

            if (heroBackground && scrolled < window.innerHeight) {
                heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }

    // Mouse movement effect for browser mockup
    function setupMouseInteraction() {
        const browserMockup = document.querySelector('.BrowserMockup');

        if (browserMockup) {
            heroSection.addEventListener('mousemove', (e) => {
                const rect = heroSection.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;

                const rotateX = (y - 0.5) * 10;
                const rotateY = (x - 0.5) * -10;

                browserMockup.style.transform = `
                    perspective(1000px)
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                    scale(1.02)
                `;
            });

            heroSection.addEventListener('mouseleave', () => {
                browserMockup.style.transform = 'perspective(1000px) rotateX(2deg) rotateY(-5deg) scale(1)';
            });
        }
    }

    // Add CSS for additional animations
    function addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideOutDown {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px);
                }
            }

            .PhoneGraphic-phone {
                transition: transform 0.3s ease;
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
        addDynamicStyles();
        setupCryptoPaymentFlow();
        setupPayButtonAnimation();
        setupCounterAnimation();
        setupParallaxEffect();
        setupMouseInteraction();

        // Performance optimization: debounce scroll events
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                // Any additional scroll handling
            }, 10);
        });
    }

    // Start initialization
    init();

    // Expose some functions globally for debugging
    window.StripeHomepage = {
        showNotification,
        init
    };
})();
