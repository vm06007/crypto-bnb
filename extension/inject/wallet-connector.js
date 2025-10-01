// This script runs in the main page context and has access to window.ethereum
(function() {

    // Listen for connection requests from the content script
    window.addEventListener('payperplane-connect-wallet', async (event) => {

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('payperplane-wallet-response', { detail: data }));
        };

        try {
            // Check if MetaMask is available
            if (!window.ethereum) {
                responseEvent({
                    success: false,
                    error: 'MetaMask is not installed. Please install MetaMask and refresh the page.'
                });
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
                params: []
            });


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

            responseEvent({
                success: true,
                account: account,
                balance: balance,
                chainId: chainId
            });

            // Store the connected account globally for balance queries
            window.__payperplane_account = account;

        } catch (error) {
            responseEvent({
                success: false,
                error: error.message || 'Failed to connect wallet',
                code: error.code
            });
        }
    });

    // Listen for BSC network switch requests
    window.addEventListener('payperplane-switch-network', async (event) => {

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('payperplane-network-response', { detail: data }));
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
            responseEvent({
                success: false,
                error: error.message || 'Failed to switch network'
            });
        }
    });

    // Listen for balance fetch requests
    window.addEventListener('payperplane-fetch-balances', async (event) => {

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('payperplane-balances-response', { detail: data }));
        };

        try {
            if (!window.ethereum || !window.__payperplane_account) {
                responseEvent({
                    success: false,
                    error: 'Wallet not connected'
                });
                return;
            }

            const account = window.__payperplane_account;

            // Get native BNB balance
            const bnbBalance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [account, 'latest']
            });

            // Convert from wei to BNB
            const bnbAmount = (parseInt(bnbBalance, 16) / Math.pow(10, 18)).toFixed(6);

            // BSC Token contract addresses
            const tokenContracts = {
                ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',   // BSC-Peg Ethereum Token
                USDT: '0x55d398326f99059fF775485246999027B3197955',  // BSC-Peg BUSD-T
                USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',  // BSC-Peg USD Coin
                CELO: '0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0'  // BSC-Peg Celo Token
            };

            // ERC-20 balanceOf function selector
            const balanceOfSelector = '0x70a08231';

            // Prepare token balance calls
            const tokenBalanceCalls = Object.entries(tokenContracts).map(([symbol, address]) => {
                // Encode the account address for balanceOf(address)
                const data = balanceOfSelector + account.slice(2).padStart(64, '0');

                return window.ethereum.request({
                    method: 'eth_call',
                    params: [{
                        to: address,
                        data: data
                    }, 'latest']
                }).then(result => {
                    // Convert from wei to token amount (assuming 18 decimals for all)
                    const balance = parseInt(result, 16) / Math.pow(10, 18);
                    return { symbol, balance: balance.toFixed(6) };
                }).catch(err => {
                    // If call fails, return 0
                    return { symbol, balance: '0.0000' };
                });
            });

            // Execute all balance calls in parallel
            const tokenResults = await Promise.all(tokenBalanceCalls);

            // Build final balances object
            const tokenBalances = {
                BNB: bnbAmount
            };

            // Add token balances
            tokenResults.forEach(({ symbol, balance }) => {
                tokenBalances[symbol] = balance;
            });

            responseEvent({
                success: true,
                balances: tokenBalances,
                account: account
            });

        } catch (error) {
            responseEvent({
                success: false,
                error: error.message || 'Failed to fetch balances'
            });
        }
    });

    // Listen for BNB price fetch requests
    window.addEventListener('payperplane-fetch-bnb-price', async (event) => {

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('payperplane-price-response', { detail: data }));
        };

        try {
            // Chainlink Price Feeds on BSC
            const chainlinkBNBUSD = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'; // BNB/USD
            const chainlinkUSDSGD = '0x3065b2369820f76C829b9BBCAF4B90F9f47d6314'; // USD/SGD

            // Encode the function call for latestAnswer()
            const functionSignature = '0x50d25bcd'; // latestAnswer() function selector


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


            // Parse the results (Chainlink returns prices with 8 decimals)
            const bnbUsdPriceInt = parseInt(bnbUsdResult, 16);
            const sgdUsdRateInt = parseInt(usdSgdResult, 16);

            const bnbPriceUSD = bnbUsdPriceInt / 100000000; // Divide by 10^8 for 8 decimals
            const sgdToUsdRate = sgdUsdRateInt / 100000000; // This is SGD/USD rate (how much USD for 1 SGD)

            // Convert to USD/SGD rate (how much SGD for 1 USD)
            const usdToSgdRate = 1 / sgdToUsdRate;

            // Calculate BNB price in SGD using proper conversion
            const bnbPriceSGD = bnbPriceUSD * usdToSgdRate;


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
    window.addEventListener('payperplane-send-transaction', async (event) => {

        const responseEvent = (data) => {
            window.dispatchEvent(new CustomEvent('payperplane-transaction-response', { detail: data }));
        };

        try {
            if (!window.ethereum) {
                responseEvent({
                    success: false,
                    error: 'MetaMask is not installed'
                });
                return;
            }

            const { from, to, value, gas, data } = event.detail;

            // Send transaction
            const txParams = {
                from: from,
                to: to,
                value: value,
                gas: gas || '0x5208',
            };
            
            // Add data field if present (for contract interaction)
            if (data) {
                txParams.data = data;
            }
            
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams],
            });

            responseEvent({
                success: true,
                txHash: txHash
            });

        } catch (error) {
            responseEvent({
                success: false,
                error: error.message || 'Transaction failed',
                code: error.code
            });
        }
    });
})();