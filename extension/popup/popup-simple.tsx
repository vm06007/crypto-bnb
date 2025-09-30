import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {

    return (
        <div className="popup-container">
            <header className="header">
                <img src="/assets/logo.png" alt="OnlyBnB" className="logo" />
                <h1>Pay with Crypto</h1>
            </header>
            <footer className="footer">
                <p>Powered by OnlyBnB</p>
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
