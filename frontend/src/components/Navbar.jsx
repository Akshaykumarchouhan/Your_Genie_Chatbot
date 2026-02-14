import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ tokensLeft = 0 }) => {
    const navigate = useNavigate();
    const prevTokens = useRef(tokensLeft);
    const [isDecreasing, setIsDecreasing] = useState(false);
    const [displayNumber, setDisplayNumber] = useState(tokensLeft);

    useEffect(() => {
        if (tokensLeft < prevTokens.current) {
            setIsDecreasing(true);
            setDisplayNumber(tokensLeft);
            prevTokens.current = tokensLeft;
            const t = setTimeout(() => setIsDecreasing(false), 800);
            return () => clearTimeout(t);
        }
        prevTokens.current = tokensLeft;
        setDisplayNumber(tokensLeft);
    }, [tokensLeft]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('tokens_left');
        navigate('/');
    };

    return (
        <nav className="navbar">
            <Link to="/chat" className="navbar-brand">
                <span className="navbar-logo">✨</span>
                <h1>Your Genie</h1>
            </Link>
            <div className="navbar-links">
                <div
                    className={`navbar-tokens ${isDecreasing ? 'navbar-tokens--decreased' : ''}`}
                    title="Chat messages remaining"
                >
                    <span className="navbar-tokens-coin" aria-hidden>💎</span>
                    <span className="navbar-tokens-count-wrap">
                        <span key={displayNumber} className="navbar-tokens-number">
                            {displayNumber}
                        </span>
                    </span>
                    <span className="navbar-tokens-suffix">tokens left</span>
                </div>
                <Link to="/chat">Chat</Link>
                <button type="button" className="navbar-logout" onClick={handleLogout}>
                    Sign out
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
