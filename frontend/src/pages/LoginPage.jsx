import React, { useState } from 'react';
import Login from '../components/Login';
import Register from '../components/Register';
import './LoginPage.css';

const LoginPage = () => {
    const [activeTab, setActiveTab] = useState('login');

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-bg-gradient" />
                <div className="auth-bg-mesh" />
                <div className="auth-bg-glow auth-bg-glow-1" />
                <div className="auth-bg-glow auth-bg-glow-2" />
                <div className="auth-bg-glow auth-bg-glow-3" />
            </div>

            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-brand">
                        <div className="auth-logo">
                            <span className="auth-logo-icon">✨</span>
                        </div>
                        <h1 className="auth-title">Your Genie</h1>
                        <p className="auth-tagline">Ask anything. Get answers that shine.</p>
                    </div>

                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                            onClick={() => setActiveTab('login')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                            onClick={() => setActiveTab('register')}
                        >
                            Create Account
                        </button>
                    </div>

                    <div className="auth-form-wrap">
                        {activeTab === 'login' && <Login onSwitch={() => setActiveTab('register')} />}
                        {activeTab === 'register' && <Register onSwitch={() => setActiveTab('login')} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
