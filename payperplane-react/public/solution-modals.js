(function() {
    'use strict';

    let isInitialized = false;

    // Solution data with detailed information and chart configurations
    const solutionData = {
        'development-api': {
            title: 'Development API',
            description: 'Integrate crypto payments into your application with our powerful API',
            chartType: 'flow',
            steps: [
                { label: 'API Call', description: 'Your app sends payment request' },
                { label: 'Crypto Payment', description: 'User pays with crypto' },
                { label: 'Conversion', description: 'We convert to fiat instantly' },
                { label: 'Settlement', description: 'Merchant receives payment' }
            ],
            features: [
                'RESTful API endpoints',
                'Webhook notifications',
                'Sandbox environment',
                'Multiple programming language SDKs',
                'Real-time exchange rates'
            ]
        },
        'invoices': {
            title: 'Crypto Invoices',
            description: 'Create and send professional invoices that accept crypto payments',
            chartType: 'pie',
            chartData: {
                labels: ['Bitcoin', 'Ethereum', 'Stablecoins', 'Other Cryptos'],
                data: [35, 25, 30, 10],
                colors: ['#f7931a', '#627eea', '#26a17b', '#cccccc']
            },
            features: [
                'Customizable invoice templates',
                'Multi-currency support',
                'Automatic conversion rates',
                'Payment tracking',
                'Email notifications'
            ]
        },
        'fiat-payments': {
            title: 'Fiat Payments',
            description: 'Accept traditional payments alongside crypto for maximum flexibility',
            chartType: 'bar',
            chartData: {
                labels: ['Credit Cards', 'Bank Transfer', 'Crypto', 'Digital Wallets'],
                data: [45, 20, 25, 10],
                label: 'Payment Methods Usage (%)'
            },
            features: [
                'Credit/debit card processing',
                'Bank transfers',
                'Seamless crypto-to-fiat bridge',
                'Unified reporting',
                'Global coverage'
            ]
        },
        'subscriptions': {
            title: 'Subscription Management',
            description: 'Recurring payments made easy with crypto',
            chartType: 'line',
            chartData: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Active Subscriptions',
                    data: [100, 150, 200, 280, 350, 420],
                    borderColor: '#FFA3BB',
                    backgroundColor: 'rgba(255, 163, 187, 0.1)'
                }]
            },
            features: [
                'Automated recurring payments',
                'Flexible billing cycles',
                'Customer portal',
                'Subscription analytics',
                'Failed payment recovery'
            ]
        },
        'payment-button': {
            title: 'Payment Button',
            description: 'Add crypto payments to any website with a simple button',
            chartType: 'doughnut',
            chartData: {
                labels: ['Setup Time', 'Integration', 'Live'],
                data: [5, 10, 85],
                colors: ['#64ACFF', '#DAFF7C', '#FFA3BB']
            },
            features: [
                'Copy-paste integration',
                'No coding required',
                'Customizable design',
                'Mobile responsive',
                'Instant setup'
            ]
        },
        'donation-tools': {
            title: 'Donation Tools',
            description: 'Accept crypto donations with dedicated tools for nonprofits',
            chartType: 'bar',
            chartData: {
                labels: ['BTC', 'ETH', 'USDT', 'USDC', 'Other'],
                data: [40, 25, 15, 15, 5],
                label: 'Donation Distribution (%)'
            },
            features: [
                'Donation widgets',
                'Donor management',
                'Tax receipts',
                'Campaign tracking',
                'Transparent reporting'
            ]
        },
        'point-of-sale': {
            title: 'Point of Sale',
            description: 'Accept crypto payments in physical stores',
            chartType: 'flow',
            steps: [
                { label: 'Generate QR', description: 'POS creates payment request' },
                { label: 'Customer Scans', description: 'Customer scans with wallet' },
                { label: 'Instant Payment', description: 'Crypto sent to merchant' },
                { label: 'Confirmation', description: 'Transaction confirmed' }
            ],
            features: [
                'QR code payments',
                'NFC support',
                'Offline mode',
                'Multi-terminal support',
                'Real-time notifications'
            ]
        },
        'plug-ins': {
            title: 'E-commerce Plug-ins',
            description: 'Ready-made integrations for popular platforms',
            chartType: 'pie',
            chartData: {
                labels: ['WooCommerce', 'Shopify', 'Magento', 'PrestaShop', 'Others'],
                data: [30, 25, 20, 15, 10],
                colors: ['#7F54B3', '#95BF47', '#EE672F', '#DF0067', '#cccccc']
            },
            features: [
                'One-click installation',
                'Platform native UI',
                'Automatic updates',
                'Full API access',
                'Support for major platforms'
            ]
        },
        'payment-widget': {
            title: 'Payment Widget',
            description: 'Embedded payment solution for seamless checkout',
            chartType: 'line',
            chartData: {
                labels: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Complete'],
                datasets: [{
                    label: 'Conversion Rate (%)',
                    data: [100, 85, 70, 65, 60],
                    borderColor: '#64ACFF',
                    backgroundColor: 'rgba(100, 172, 255, 0.1)'
                }]
            },
            features: [
                'Embeddable widget',
                'Customizable UI',
                'Multi-language support',
                'Mobile optimized',
                'Analytics dashboard'
            ]
        },
        'white-label': {
            title: 'White Label Solution',
            description: 'Fully branded crypto payment solution for your business',
            chartType: 'radar',
            chartData: {
                labels: ['Branding', 'Features', 'Support', 'Flexibility', 'Security'],
                datasets: [{
                    label: 'White Label',
                    data: [100, 95, 90, 100, 100],
                    borderColor: '#FFA3BB',
                    backgroundColor: 'rgba(255, 163, 187, 0.2)'
                }, {
                    label: 'Standard',
                    data: [50, 80, 70, 60, 100],
                    borderColor: '#64ACFF',
                    backgroundColor: 'rgba(100, 172, 255, 0.2)'
                }]
            },
            features: [
                'Complete branding control',
                'Custom domain',
                'API customization',
                'Dedicated support',
                'Revenue sharing options'
            ]
        },
        'mass-payouts': {
            title: 'Mass Payouts',
            description: 'Send crypto payments to multiple recipients at once',
            chartType: 'bar',
            chartData: {
                labels: ['Manual', 'PayperPlane Batch', 'Time Saved'],
                data: [100, 10, 90],
                label: 'Processing Time (minutes)'
            },
            features: [
                'Batch processing',
                'CSV upload',
                'Automatic conversion',
                'Transaction tracking',
                'Detailed reporting'
            ]
        },
        'custody': {
            title: 'Custody Solutions',
            description: 'Secure storage and management of crypto assets',
            chartType: 'doughnut',
            chartData: {
                labels: ['Cold Storage', 'Hot Wallet', 'Multi-sig Reserve'],
                data: [70, 20, 10],
                colors: ['#0066cc', '#FFA3BB', '#DAFF7C']
            },
            features: [
                'Cold storage security',
                'Multi-signature wallets',
                'Insurance coverage',
                'Audit trails',
                '24/7 monitoring'
            ]
        },
        'off-ramp-payouts': {
            title: 'Off-ramp Payouts',
            description: 'Convert crypto to fiat and withdraw to bank accounts',
            chartType: 'flow',
            steps: [
                { label: 'Crypto Balance', description: 'Select amount to withdraw' },
                { label: 'Convert', description: 'Instant conversion at best rates' },
                { label: 'Bank Transfer', description: 'Send to bank account' },
                { label: 'Receive Funds', description: 'Funds in account (1-3 days)' }
            ],
            features: [
                'Competitive exchange rates',
                'Multiple fiat currencies',
                'Bank wire transfers',
                'Compliance built-in',
                'Transaction history'
            ]
        },
        'customer-operations': {
            title: 'Customer Operations',
            description: 'Complete toolkit for managing crypto payment operations',
            chartType: 'line',
            chartData: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Support Tickets',
                    data: [50, 45, 40, 35],
                    borderColor: '#FFA3BB',
                    backgroundColor: 'rgba(255, 163, 187, 0.1)'
                }, {
                    label: 'Resolution Time (hours)',
                    data: [24, 18, 12, 8],
                    borderColor: '#64ACFF',
                    backgroundColor: 'rgba(100, 172, 255, 0.1)'
                }]
            },
            features: [
                'Customer dashboard',
                'Transaction monitoring',
                'Dispute management',
                'Analytics & reporting',
                '24/7 support tools'
            ]
        }
    };

    // Initialize solution modals
    function initializeSolutionModals() {
        console.log('Initializing solution modals...');

        // Convert all bubble links to modal triggers
        const bubbleLinks = document.querySelectorAll('.main-new-bubble_link');
        console.log('Found bubble links:', bubbleLinks.length);

        bubbleLinks.forEach(link => {
            // Get the solution type from the href
            const href = link.getAttribute('href');
            const solutionType = getSolutionTypeFromHref(href);
            
            if (solutionType && solutionData[solutionType]) {
                // Remove href and add click handler
                link.removeAttribute('href');
                link.style.cursor = 'pointer';
                link.setAttribute('data-solution', solutionType);
                
                // Remove existing listeners
                link.removeEventListener('click', handleSolutionClick);
                link.addEventListener('click', handleSolutionClick);
            }
        });

        isInitialized = true;
    }

    // Get solution type from href
    function getSolutionTypeFromHref(href) {
        if (!href) return null;
        
        const mappings = {
            '/api': 'development-api',
            '/invoices': 'invoices',
            '/fiat-on-ramp': 'fiat-payments',
            '/subscriptions': 'subscriptions',
            '/payment-button': 'payment-button',
            '/donation-tools': 'donation-tools',
            '/pos': 'point-of-sale',
            '/payment-tools': 'plug-ins',
            '/payment-widget': 'payment-widget',
            '/white-label': 'white-label',
            '/mass-payments': 'mass-payouts',
            '/custody': 'custody',
            '/off-ramp': 'off-ramp-payouts',
            '/customer-operations': 'customer-operations'
        };

        for (const [path, type] of Object.entries(mappings)) {
            if (href.includes(path)) return type;
        }
        return null;
    }

    // Handle solution click
    function handleSolutionClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const solutionType = this.getAttribute('data-solution');
        console.log('Solution clicked:', solutionType);
        openSolutionModal(solutionType);
    }

    // Open solution modal
    function openSolutionModal(type) {
        const data = solutionData[type];
        if (!data) return;

        // Remove existing modal
        const existingModal = document.querySelector('.solution-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'solution-modal';
        modal.innerHTML = `
            <div class="solution-modal__overlay"></div>
            <div class="solution-modal__content">
                <div class="solution-modal__header">
                    <h2 class="solution-modal__title">${data.title}</h2>
                    <button class="solution-modal__close">&times;</button>
                </div>
                <div class="solution-modal__body">
                    <p class="solution-modal__description">${data.description}</p>
                    <div class="solution-modal__chart-container">
                        <canvas id="solution-chart-${type}" width="400" height="300"></canvas>
                    </div>
                    <div class="solution-modal__actions">
                        <a href="https://account.PayperPlane.io/create-account" class="solution-modal__button solution-modal__button--primary" target="_blank">Get Started</a>
                        <button class="solution-modal__button solution-modal__button--secondary" onclick="window.open('https://PayperPlane.io${getOriginalPath(type)}', '_blank')">Learn More</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add active class for animation
        setTimeout(() => {
            modal.classList.add('active');
            // Create chart after modal is visible
            createChart(type, data);
        }, 10);

        // Handle close
        const closeBtn = modal.querySelector('.solution-modal__close');
        const overlay = modal.querySelector('.solution-modal__overlay');

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
            document.removeEventListener('keydown', handleEscKey);
        };

        const handleEscKey = (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
                closeModal();
            }
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        document.addEventListener('keydown', handleEscKey);
    }

    // Get original path for learn more button
    function getOriginalPath(type) {
        const paths = {
            'development-api': '/api',
            'invoices': '/invoices',
            'fiat-payments': '/fiat-on-ramp',
            'subscriptions': '/subscriptions',
            'payment-button': '/payment-button',
            'donation-tools': '/donation-tools',
            'point-of-sale': '/pos',
            'plug-ins': '/payment-tools',
            'payment-widget': '/payment-widget',
            'white-label': '/white-label',
            'mass-payouts': '/mass-payments',
            'custody': '/custody',
            'off-ramp-payouts': '/off-ramp',
            'customer-operations': '/customer-operations'
        };
        return paths[type] || '';
    }

    // Create chart based on type
    function createChart(type, data) {
        const canvas = document.getElementById(`solution-chart-${type}`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Handle flow charts differently
        if (data.chartType === 'flow') {
            createFlowChart(ctx, canvas, data.steps);
            return;
        }

        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                createChartWithLibrary(ctx, type, data);
            };
            document.head.appendChild(script);
        } else {
            createChartWithLibrary(ctx, type, data);
        }
    }

    // Create flow chart (custom implementation)
    function createFlowChart(ctx, canvas, steps) {
        const width = canvas.width;
        const height = canvas.height;
        const stepWidth = width / (steps.length + 1);
        const centerY = height / 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set styles
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';

        steps.forEach((step, index) => {
            const x = stepWidth * (index + 1);
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(x, centerY, 30, 0, 2 * Math.PI);
            ctx.fillStyle = '#64ACFF';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw step number
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(index + 1, x, centerY + 5);

            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(step.label, x, centerY - 45);

            // Draw description
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            const words = step.description.split(' ');
            let line = '';
            let y = centerY + 45;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > stepWidth - 20 && line !== '') {
                    ctx.fillText(line, x, y);
                    line = word + ' ';
                    y += 15;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, x, y);

            // Draw arrow to next step
            if (index < steps.length - 1) {
                ctx.beginPath();
                ctx.moveTo(x + 30, centerY);
                ctx.lineTo(x + stepWidth - 30, centerY);
                ctx.strokeStyle = '#DAFF7C';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Arrow head
                ctx.beginPath();
                ctx.moveTo(x + stepWidth - 35, centerY - 5);
                ctx.lineTo(x + stepWidth - 30, centerY);
                ctx.lineTo(x + stepWidth - 35, centerY + 5);
                ctx.strokeStyle = '#DAFF7C';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }

    // Create chart with Chart.js library
    function createChartWithLibrary(ctx, type, data) {
        let config = {
            type: data.chartType,
            data: {},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        };

        // Configure based on chart type
        switch (data.chartType) {
            case 'pie':
            case 'doughnut':
                config.data = {
                    labels: data.chartData.labels,
                    datasets: [{
                        data: data.chartData.data,
                        backgroundColor: data.chartData.colors || ['#64ACFF', '#DAFF7C', '#FFA3BB', '#cccccc', '#666666']
                    }]
                };
                break;

            case 'bar':
                config.data = {
                    labels: data.chartData.labels,
                    datasets: [{
                        label: data.chartData.label || 'Data',
                        data: data.chartData.data,
                        backgroundColor: '#64ACFF'
                    }]
                };
                config.options.scales = {
                    y: {
                        beginAtZero: true
                    }
                };
                break;

            case 'line':
                config.data = data.chartData;
                config.options.scales = {
                    y: {
                        beginAtZero: true
                    }
                };
                break;

            case 'radar':
                config.data = data.chartData;
                config.options.scales = {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                };
                break;
        }

        new Chart(ctx, config);
    }

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .solution-modal {
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

        .solution-modal.active {
            opacity: 1;
            visibility: visible;
        }

        .solution-modal__overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(19, 23, 28, 0.9);
            cursor: pointer;
        }

        .solution-modal__content {
            position: relative;
            background: #ffffff;
            border-radius: 20px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }

        .solution-modal.active .solution-modal__content {
            transform: scale(1);
        }

        .solution-modal__header {
            padding: 30px;
            border-bottom: 1px solid #e5e5e5;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .solution-modal__title {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            color: #13171C;
        }

        .solution-modal__close {
            background: none;
            border: none;
            font-size: 32px;
            cursor: pointer;
            color: #999;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }

        .solution-modal__close:hover {
            background: #f5f5f5;
            color: #333;
        }

        .solution-modal__body {
            padding: 30px;
        }

        .solution-modal__description {
            font-size: 18px;
            color: #666;
            margin: 0 0 30px;
            line-height: 1.6;
        }

        .solution-modal__chart-container {
            background: #f9f9f9;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .solution-modal__actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
        }

        .solution-modal__button {
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
            border: none;
            display: inline-block;
        }

        .solution-modal__button--primary {
            background: #64ACFF;
            color: white;
        }

        .solution-modal__button--primary:hover {
            background: #4A92E5;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(100, 172, 255, 0.3);
        }

        .solution-modal__button--secondary {
            background: transparent;
            color: #64ACFF;
            border: 2px solid #64ACFF;
        }

        .solution-modal__button--secondary:hover {
            background: #64ACFF;
            color: white;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .solution-modal__content {
                width: 95%;
                max-height: 95vh;
            }

            .solution-modal__header {
                padding: 20px;
            }

            .solution-modal__body {
                padding: 20px;
            }

            .solution-modal__title {
                font-size: 24px;
            }

            .solution-modal__actions {
                flex-direction: column;
            }

            .solution-modal__button {
                width: 100%;
                text-align: center;
            }
        }
    `;
    document.head.appendChild(style);

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
        // Check if solution bubbles are present
        if (document.querySelector('.main-new-bubble_link') && !isInitialized) {
            initializeSolutionModals();
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Try to initialize immediately if bubbles are already present
    if (document.querySelector('.main-new-bubble_link')) {
        initializeSolutionModals();
    }

    // Expose function globally
    window.initializeSolutionModals = initializeSolutionModals;

    console.log('Solution modals script loaded');
})();
