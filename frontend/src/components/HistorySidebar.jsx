import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './HistorySidebar.css';

const HistorySidebar = ({ onSelect, isOpen, refreshTrigger = 0 }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            setLoading(true);
            setError('');
            try {
                const res = await api.get('/chat/history', {
                    headers: { 'x-auth-token': token },
                });
                setHistory(res.data.history || []);
            } catch (err) {
                setError('Could not load history');
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [isOpen, refreshTrigger]);

    const handleSelect = (prompt) => {
        if (typeof onSelect === 'function') onSelect(prompt);
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <aside className={`history-sidebar ${isOpen ? 'history-sidebar--open' : ''}`}>
            <div className="history-sidebar-header">
                <h2 className="history-sidebar-title">History</h2>
                <p className="history-sidebar-subtitle">Past searches</p>
            </div>
            <div className="history-sidebar-list">
                {loading && (
                    <div className="history-sidebar-loading">Loading...</div>
                )}
                {error && (
                    <div className="history-sidebar-error">{error}</div>
                )}
                {!loading && !error && history.length === 0 && (
                    <div className="history-sidebar-empty">No past searches yet.</div>
                )}
                {!loading && history.length > 0 && history.map((item, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className="history-sidebar-item"
                        onClick={() => handleSelect(item.prompt)}
                        title={item.prompt}
                    >
                        <span className="history-sidebar-item-text">
                            {item.prompt.length > 60 ? item.prompt.slice(0, 60) + '…' : item.prompt}
                        </span>
                        <span className="history-sidebar-item-date">{formatDate(item.createdAt)}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default HistorySidebar;
