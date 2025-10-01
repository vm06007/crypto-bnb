// This script runs in the main page context and has access to window.ethereum
(function() {
    console.log('[OnlyBnB Injected] Wallet connector script loaded');
    console.log('[OnlyBnB Injected] window.ethereum available:', !!window.ethereum);

    // Listen for connection requests from the content script
    window.addEventListener('onlybnb-connect-wallet', async (event) => {
        console.log('[OnlyBnB Injected] Received wallet connection request');

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('onlybnb-wallet-response', { detail: data }));
        };

        try {
            // Check if MetaMask is available
            if (!window.ethereum) {
                console.log('[OnlyBnB Injected] No ethereum provider found');
                responseEvent({
                    success: false,
                    error: 'MetaMask is not installed. Please install MetaMask and refresh the page.'
                });
                return;
            }

            console.log('[OnlyBnB Injected] Found ethereum provider:', window.ethereum);
            console.log('[OnlyBnB Injected] Is MetaMask:', window.ethereum.isMetaMask);

            // Request account access
            console.log('[OnlyBnB Injected] Requesting accounts...');
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
                params: []
            });

            console.log('[OnlyBnB Injected] Accounts received:', accounts);

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned from MetaMask');
            }

            const account = accounts[0];

            // Get balance
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [account, 'latest']
            });

            // Get current chain ID
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            console.log('[OnlyBnB Injected] Connection successful!');
            responseEvent({
                success: true,
                account: account,
                balance: balance,
                chainId: chainId
            });

            // Store the connected account globally for balance queries
            window.__onlybnb_account = account;

        } catch (error) {
            console.error('[OnlyBnB Injected] Wallet connection failed:', error);
            responseEvent({
                success: false,
                error: error.message || 'Failed to connect wallet',
                code: error.code
            });
        }
    });

    // Listen for BSC network switch requests
    window.addEventListener('onlybnb-switch-network', async (event) => {
        console.log('[OnlyBnB Injected] Received network switch request');

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('onlybnb-network-response', { detail: data }));
        };

        try {
            const chainId = '0x38'; // BSC mainnet

            // Check current chain
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

            if (currentChainId === chainId) {
                responseEvent({ success: true, message: 'Already on BSC network' });
                return;
            }

            // Try to switch
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId }],
                });
                responseEvent({ success: true, message: 'Switched to BSC network' });
            } catch (switchError) {
                // If the chain doesn't exist, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId,
                            chainName: 'BNB Smart Chain',
                            nativeCurrency: {
                                name: 'BNB',
                                symbol: 'BNB',
                                decimals: 18,
                            },
                            rpcUrls: ['https://bsc-dataseed.binance.org/'],
                            blockExplorerUrls: ['https://bscscan.com/'],
                        }],
                    });
                    responseEvent({ success: true, message: 'BSC network added and switched' });
                } else {
                    throw switchError;
                }
            }
        } catch (error) {
            console.error('[OnlyBnB Injected] Network switch failed:', error);
            responseEvent({
                success: false,
                error: error.message || 'Failed to switch network'
            });
        }
    });

    // Listen for balance fetch requests
    window.addEventListener('onlybnb-fetch-balances', async (event) => {
        console.log('[OnlyBnB Injected] Received balance fetch request');

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('onlybnb-balances-response', { detail: data }));
        };

        try {
            if (!window.ethereum || !window.__onlybnb_account) {
                responseEvent({
                    success: false,
                    error: 'Wallet not connected'
                });
                return;
            }

            const account = window.__onlybnb_account;

            // Get native BNB balance
            const bnbBalance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [account, 'latest']
            });

            // Convert from wei to BNB
            const bnbAmount = (parseInt(bnbBalance, 16) / Math.pow(10, 18)).toFixed(6);

            // For ERC-20 tokens, we need the ABI and contract addresses
            const tokenBalances = {
                BNB: bnbAmount,
                ETH: '0.0000', // Coming soon - BSC-pegged ETH
                USDT: '0.0000', // Coming soon - BSC USDT
                USDC: '0.0000'  // Coming soon - BSC USDC
            };

            // In a real implementation, you'd call the balanceOf method on each token contract
            // For now, returning the native BNB balance and zeros for tokens

            console.log('[OnlyBnB Injected] Balances fetched:', tokenBalances);
            responseEvent({
                success: true,
                balances: tokenBalances,
                account: account
            });

        } catch (error) {
            console.error('[OnlyBnB Injected] Balance fetch failed:', error);
            responseEvent({
                success: false,
                error: error.message || 'Failed to fetch balances'
            });
        }
    });

    // Listen for BNB price fetch requests
    window.addEventListener('onlybnb-fetch-bnb-price', async (event) => {
        console.log('[OnlyBnB Injected] Fetching BNB price from Chainlink...');

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('onlybnb-price-response', { detail: data }));
        };

        try {
            // Chainlink Price Feeds on BSC
            const chainlinkBNBUSD = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'; // BNB/USD
            const chainlinkUSDSGD = '0x3065b2369820f76C829b9BBCAF4B90F9f47d6314'; // USD/SGD

            // Encode the function call for latestAnswer()
            const functionSignature = '0x50d25bcd'; // latestAnswer() function selector

            console.log('[OnlyBnB Injected] Calling Chainlink contracts for prices...');

            // Call both contracts in parallel
            const [bnbUsdResult, usdSgdResult] = await Promise.all([
                window.ethereum.request({
                    method: 'eth_call',
                    params: [{
                        to: chainlinkBNBUSD,
                        data: functionSignature
                    }, 'latest']
                }),
                window.ethereum.request({
                    method: 'eth_call',
                    params: [{
                        to: chainlinkUSDSGD,
                        data: functionSignature
                    }, 'latest']
                })
            ]);

            console.log('[OnlyBnB Injected] Chainlink results:', { bnbUsdResult, usdSgdResult });

            // Parse the results (Chainlink returns prices with 8 decimals)
            const bnbUsdPriceInt = parseInt(bnbUsdResult, 16);
            const sgdUsdRateInt = parseInt(usdSgdResult, 16);

            const bnbPriceUSD = bnbUsdPriceInt / 100000000; // Divide by 10^8 for 8 decimals
            const sgdToUsdRate = sgdUsdRateInt / 100000000; // This is SGD/USD rate (how much USD for 1 SGD)

            // Convert to USD/SGD rate (how much SGD for 1 USD)
            const usdToSgdRate = 1 / sgdToUsdRate;

            // Calculate BNB price in SGD using proper conversion
            const bnbPriceSGD = bnbPriceUSD * usdToSgdRate;

            console.log('[OnlyBnB Injected] Calculated prices:', {
                bnbPriceUSD: bnbPriceUSD,
                sgdToUsdRate: sgdToUsdRate,
                usdToSgdRate: usdToSgdRate,
                bnbPriceSGD: bnbPriceSGD
            });

            responseEvent({
                success: true,
                prices: {
                    usd: bnbPriceUSD,
                    sgd: bnbPriceSGD
                },
                source: 'chainlink',
                rates: {
                    bnbUsd: bnbPriceUSD,
                    sgdUsd: sgdToUsdRate,
                    usdSgd: usdToSgdRate
                }
            });

        } catch (error) {
            console.error('[OnlyBnB Injected] Failed to fetch from Chainlink:', error);

            // Fallback to reasonable current prices
            responseEvent({
                success: true,
                prices: {
                    usd: 600, // Fallback price
                    sgd: 810  // Fallback price
                },
                fallback: true,
                error: error.message
            });
        }
    });

    // Listen for transaction send requests
    window.addEventListener('onlybnb-send-transaction', async (event) => {
        console.log('[OnlyBnB Injected] Received transaction request', event.detail);

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('onlybnb-transaction-response', { detail: data }));
        };

        try {
            if (!window.ethereum) {
                responseEvent({
                    success: false,
                    error: 'MetaMask is not installed'
                });
                return;
            }

            const { from, to, value, gas } = event.detail;

            // Send transaction
            console.log('[OnlyBnB Injected] Sending transaction...');
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: from,
                    to: to,
                    value: value,
                    gas: gas || '0x5208',
                }],
            });

            console.log('[OnlyBnB Injected] Transaction sent successfully:', txHash);
            responseEvent({
                success: true,
                txHash: txHash
            });

        } catch (error) {
            console.error('[OnlyBnB Injected] Transaction failed:', error);
            responseEvent({
                success: false,
                error: error.message || 'Transaction failed',
                code: error.code
            });
        }
    });

    console.log('[OnlyBnB Injected] Wallet connector ready');
})();