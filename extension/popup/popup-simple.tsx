import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    return (
        <div className="popup-container">
            <header className="header">
                <img src="/assets/icon48.png" alt="PayperPlane" className="logo" />
                <h1>PayperPlane</h1>
            </header>

            <main className="content">
                <section className="intro">
                    <h2>Pay with Crypto Instead of Card</h2>
                    <p>PayperPlane seamlessly replaces traditional card payment forms with cryptocurrency payments.</p>
                </section>

                <section className="how-it-works">
                    <h3>How it works:</h3>
                    <ol>
                        <li>
                            <span className="step-icon">🔍</span>
                            <div>
                                <strong>Detects Payment Forms</strong>
                                <p>Automatically identifies card payment forms on websites</p>
                            </div>
                        </li>
                        <li>
                            <span className="step-icon">💳</span>
                            <div>
                                <strong>Replaces with Crypto</strong>
                                <p>Overwrites card inputs with crypto payment options</p>
                            </div>
                        </li>
                        <li>
                            <span className="step-icon">🔗</span>
                            <div>
                                <strong>Connect Your Wallet</strong>
                                <p>Link your crypto wallet (MetaMask, WalletConnect, etc.)</p>
                            </div>
                        </li>
                        <li>
                            <span className="step-icon">✅</span>
                            <div>
                                <strong>Complete Payment</strong>
                                <p>Pay instantly with BNB or other cryptocurrencies</p>
                            </div>
                        </li>
                    </ol>
                </section>

            </main>
            <footer className="footer">
                <p>Powered by PayperPlane</p>
            </footer>
        </div>
    );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
