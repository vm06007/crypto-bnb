(function() {
    'use strict';

    let isInitialized = false;

    // Function to initialize modal handlers
    function initializeModals() {
        console.log('Initializing modal handlers...');

        // Handle menu item clicks
        const modalLinks = document.querySelectorAll('[data-modal]');
        console.log('Found modal links:', modalLinks.length);

        modalLinks.forEach(link => {
            // Remove any existing listeners to prevent duplicates
            link.removeEventListener('click', handleModalClick);
            link.addEventListener('click', handleModalClick);
        });

        isInitialized = true;
    }

    // Handle modal link clicks
    function handleModalClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const modalType = this.getAttribute('data-modal');
        console.log('Modal link clicked:', modalType);
        openModal(modalType);
    }

    // Function to open modal
    function openModal(type) {
        console.log('Opening modal:', type);

        // Remove any existing modals
        const existingModal = document.querySelector('.custom-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal__overlay"></div>
            <div class="custom-modal__content">
                <div class="custom-modal__header">
                    <h2 class="custom-modal__title">${getModalTitle(type)}</h2>
                    <button class="custom-modal__close">&times;</button>
                </div>
                <div class="custom-modal__body">
                    ${getModalContent(type)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add active class for animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // Handle close
        const closeBtn = modal.querySelector('.custom-modal__close');
        const overlay = modal.querySelector('.custom-modal__overlay');

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
            // Remove ESC key listener when modal is closed
            document.removeEventListener('keydown', handleEscKey);
        };

        // Handle ESC key press
        const handleEscKey = (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
                closeModal();
            }
        };

        // Add event listeners
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', handleEscKey);
    }

    // Get modal title based on type
    function getModalTitle(type) {
        const titles = {
            product: 'The Problem We Are Solving',
            solutions: 'Our Solution',
            builders: 'Builders',
            currencies: 'Supported Currencies',
            demo: 'See It In Action',
            contact: 'Contact Us'
        };
        return titles[type] || 'Information';
    }

    // Get modal content based on type
    function getModalContent(type) {
        const content = {
            product: `
                <div class="modal-section">
                    <h3>The Big Picture</h3>
                    <p>$3.9 trillion in cryptocurrency is held globally,  yet <1% of online merchants accept crypto payments.</p>
                    <div style="height: 16px;"></div>

                    <h3>The Frustrations We Solve</h3>
                    <ul>
                        <li><strong>• You have crypto ready to spend</strong> - But sites force you into the traditional banking system</li>
                        <li><strong>• No direct crypto payment options</strong> - Even tech-forward companies still use cards</li>
                        <li><strong>• Unnecessary friction</strong> - Users need to converting crypto → fiat → bank → card </li>
                        <li><strong>• Privacy invasion</strong> - Card payments expose your financial data</li>
                    </ul>

                    <h3>Target Users</h3>
                    <ul>
                        <li><strong>• Digital nomads & travelers</strong> - 35M+ remote workers need flexible payment options</li>
                        <li><strong>• Crypto natives</strong> - 560M+ crypto owners</li>
                        <li><strong>• The unbanked</strong> - 1.4B adults without bank accounts</li>
                        <li><strong>• International users</strong> - Avoid 2–5% forex fees and poor exchange rates</li>
                    </ul>


                    
                </div>
            `,
            solutions: `
                <div class="modal-section">
                    <h3>The PayperPlane Plugin</h3>
                    <p>A browser extension that detects card payment forms and enables crypto payments - even on sites that don't accept crypto!</p>
                    <br/>     
                    <h3>How It Works</h3>
                    <p>When you see card input fields on any website, our browser extension springs into action:</p>
                    <ul>
                        <li><strong>• Detects payment forms automatically</strong> ✨ </li>
                        <li><strong>• Adds "Pay with Crypto" option instantly</strong> 🔄 </li>
                        <li><strong>• Handles the card payment on your behalf</strong> 💳 </li>
                        <li><strong>• You never touch the banking system</strong> 🔒 </li>
                    </ul>
                    <p>In the background we generate one-time use virtual cards with the correct amount of fiat currency to provide seamless crypto payment.</p>
                    <br/>     
                    <h3>How It Compares With Other Solutions</h3>
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="./files/comparison_chart.png" alt="Comparison chart showing PayperPlane vs other solutions" style="max-width: 100%; height: auto; border-radius: 8px;" />
                    </div>
                    <br/>     
                    <h3>Key Benefits</h3>
                    <ul>
                        <li>• Works on ANY site that accepts cards</li>
                        <li>• No merchant integration needed</li>
                        <li>• Keep your crypto</li>
                        <li>• Privacy preserved</li>
                        <li>• Global access</li>
                    </ul>

                    <h3>Cool Features</h3>
                    <ul>
                        <li>• <strong>Universal wallet support</strong> - Works with MetaMask, Rabby, Privy, and any EVM wallet</li>
                        <li>• <strong>Major crypto support</strong> - USDC, USDT, ETH, and more</li>
                        <li>• <strong>Multi-chain ready</strong> - BSC, Celo, TAC, Moonbeam, and others</li>
                        <li>• <strong>Beyond shopping</strong> - Works for car rentals, flights, e-commerce, subscriptions</li>
                        <li>• <strong>Easy refunds</strong> - Crypto automatically returned to your wallet</li>
                        <li>• <strong>Built-in compliance</strong> - KYC verification and sanctions checking (planned)</li>
                        <li>• <strong>Smart optimization</strong> - Auto-selects cheapest chain and prioritizes stablecoins (planned)</li>
                    </ul>

                </div>
            `,
            builders: `
                <div class="modal-section">
                    <h3>Meet the Hackers Behind PayperPlane</h3>
                    <p style="margin-bottom: 24px;">Built with ❤️ during the hackathon by three passionate developers who believe crypto payments should be accessible everywhere.</p>

                    <div class="hacker-profiles">
                        <div class="hacker-card">
                            <div class="hacker-avatar">
                                <img src="./files/team_vitalik.jpeg" alt="Vitalik" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
                            </div>
                            <h4>Vitalik</h4>
                            <p class="hacker-role">Full-Stack Developer</p>
                            <p class="hacker-bio">Blockchain enthusiast with 5+ years in DeFi. Built the smart contract infrastructure and browser extension core.</p>
                            <div class="hacker-skills">
                                <span>Solidity</span>
                                <span>TypeScript</span>
                                <span>Web3.js</span>
                            </div>
                        </div>

                        <div class="hacker-card">
                            <div class="hacker-avatar">
                                <img src="./files/team_lya.jpeg" alt="Lya" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
                            </div>
                            <h4>Lya</h4>
                            <p class="hacker-role">Frontend Engineer</p>
                            <p class="hacker-bio">A UX/UI specialist dedicated to enhancing crypto accessibility through insightful marketing research and intuitive product design.</p>
                            <div class="hacker-skills">
                                <span>React</span>
                                <span>Extension APIs</span>
                                <span>UI/UX</span>
                            </div>
                        </div>

                        <div class="hacker-card">
                            <div class="hacker-avatar">
                                <img src="./files/team_akuti.png" alt="Akuti" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
                            </div>
                            <h4>Akuti</h4>
                            <p class="hacker-role">Backend Engineer</p>
                            <p class="hacker-bio">Smart contract engineer. Architected the crypto-to-card conversion engine.</p>
                            <div class="hacker-skills">
                                <span>Python</span>
                                <span>Payment APIs</span>
                                <span>Security</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            currencies: `
                <div class="modal-section">
                    <div class="currency-grid">
                        <div class="currency-item">
                            <strong>ETH</strong>
                        </div>
                        <div class="currency-item">
                            <strong>USDT</strong>
                        </div>
                        <div class="currency-item">
                            <strong>USDC</strong>
                        </div>
                        <div class="currency-item">
                            <strong>BNB</strong>
                        </div>
                    </div>
                    <p style="margin-top: 20px; text-align: center; font-weight: bold;">Coming Soon</p>
                    <div class="currency-grid" style="margin-top: 20px; display: flex; justify-content: center; gap: 20px;">
                        <div class="currency-item">
                            <strong>Bitcoin (BTC)</strong>
                        </div>
                        <div class="currency-item">
                            <strong>Solana (SOL)</strong>
                        </div>
                    </div>
                </div>
            `,
            demo: `
                <div class="modal-section">
                    <h3>Watch PayperPlane in Action</h3>
                    <p style="margin-bottom: 20px;">See how easy it is to pay with crypto on any website that accepts cards.</p>
                    <div style="position: relative; max-width: 100%; background: #000; border-radius: 8px; overflow: hidden;">
                        <video
                            id="demo-video"
                            style="width: 100%; height: auto; display: block;"
                            controls
                            autoplay
                            muted
                            playsinline
                            poster="/files/demo-poster.jpg">
                            <source src="/files/payperplane-demo.mp4" type="video/mp4">
                            <source src="/files/payperplane-demo.webm" type="video/webm">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <div style="margin-top: 30px;">
                        <h4>Key Features Demonstrated:</h4>
                        <ul>
                            <li>🔍 Automatic payment form detection</li>
                            <li>💳 Seamless crypto-to-card conversion</li>
                            <li>🌍 Works on any website globally</li>
                            <li>🔒 Secure and private transactions</li>
                            <li>⚡ Instant payment processing</li>
                        </ul>
                    </div>
                    <p style="margin-top: 20px; text-align: center;">
                        <strong>Ready to start?</strong> Install the extension from our GitHub repository!
                    </p>
                </div>
            `,
            contact: `
                <div class="modal-section">
                    <h3>Get in Touch</h3>
                    <form class="contact-form">
                        <input type="text" placeholder="Your Name" required>
                        <input type="email" placeholder="Email Address" required>
                        <textarea placeholder="How can we help?" rows="4" required></textarea>
                        <button type="submit" class="modal-button">Send Message</button>
                    </form>
                    <div style="margin-top: 30px;">
                        <p><strong>Email:</strong> support@payperplane.io</p>
                        <p><strong>Telegram:</strong> @payperplane</p>
                    </div>
                </div>
            `
        };
        return content[type] || '<p>Content coming soon...</p>';
    }

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .custom-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .custom-modal.active {
            opacity: 1;
            visibility: visible;
        }

        .custom-modal__overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            cursor: pointer;
        }

        .custom-modal__content {
            position: relative;
            background: white;
            border-radius: 12px;
            max-width: 900px;
            width: 90%;
            max-height: 80vh;
            overflow: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }

        .custom-modal.active .custom-modal__content {
            transform: scale(1);
        }

        .custom-modal__header {
            padding: 24px;
            border-bottom: 1px solid #e5e5e5;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .custom-modal__title {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            color: #333;
        }

        .custom-modal__close {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #999;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
        }

        .custom-modal__close:hover {
            background: #f5f5f5;
            color: #333;
        }

        .custom-modal__body {
            padding: 24px;
        }

        .modal-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px;
            color: #333;
        }

        .modal-section ul {
            list-style: none;
            padding: 0;
            margin: 0 0 24px;
        }

        .modal-section li {
            padding: 8px 0;
            position: relative;
            color: #666;
        }

        .modal-section li:before {
            content: "";
            position: absolute;
            left: 0;
            color: #0066cc;
        }

        .modal-button {
            display: inline-block;
            padding: 12px 24px;
            background: #0066cc;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }

        .modal-button:hover {
            background: #0052a3;
        }

        .currency-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }

        .currency-item {
            padding: 12px;
            background: #f5f5f5;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e5e5;
        }

        .pricing-option {
            background: #f9f9f9;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e5e5e5;
        }

        .pricing-option h4 {
            margin: 0 0 12px;
            font-size: 20px;
            color: #333;
        }

        .pricing-option p {
            margin: 0 0 16px;
            font-size: 18px;
            color: #666;
        }

        .demo-form, .contact-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Video styles */
        .modal-section video {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .demo-form input,
        .demo-form textarea,
        .contact-form input,
        .contact-form textarea {
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            font-family: inherit;
        }

        .demo-form input:focus,
        .demo-form textarea:focus,
        .contact-form input:focus,
        .contact-form textarea:focus {
            outline: none;
            border-color: #0066cc;
        }

        /* Spinner styles */
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

        @keyframes rotate {
            to {
                transform: rotate(360deg);
            }
        }

        /* Small spinner variant for inline use */
        .random-spinner.small {
            width: 16px;
            height: 16px;
            border-width: 2px;
        }

        /* Hacker profiles styles */
        .hacker-profiles {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 24px 0;
        }

        .hacker-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e9ecef;
            transition: transform 0.2s, box-shadow 0.2s;
            min-height: 320px;
            display: flex;
            flex-direction: column;
        }

        .hacker-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .hacker-avatar {
            width: 80px;
            height: 80px;
            margin: 0 auto 16px;
            position: relative;
        }

        .avatar-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
        }

        .hacker-card h4 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px;
            color: #333;
        }

        .hacker-role {
            font-size: 14px;
            color: #0066cc;
            font-weight: 500;
            margin: 0 0 12px;
        }

        .hacker-bio {
            font-size: 14px;
            color: #666;
            line-height: 1.5;
            margin: 0 0 16px;
            min-height: 60px;
        }

        .hacker-skills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }

        .hacker-skills span {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
        }

        @media (max-width: 768px) {
            .hacker-profiles {
                grid-template-columns: 1fr;
                gap: 16px;
            }

            .custom-modal__content {
                max-width: 95%;
            }

            .hacker-card {
                min-height: auto;
            }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
            .hacker-profiles {
                gap: 16px;
            }

            .hacker-card {
                padding: 16px;
            }

            .hacker-bio {
                font-size: 13px;
            }
        }
    `;
    document.head.appendChild(style);

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
        // Check if header is present and initialize if not already done
        if (document.querySelector('.header') && !isInitialized) {
            initializeModals();
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also try to initialize immediately if header is already present
    if (document.querySelector('.header')) {
        initializeModals();
    }

    // Expose function globally for debugging
    window.initializeModals = initializeModals;

    console.log('Modal handler v2 loaded');
})();

