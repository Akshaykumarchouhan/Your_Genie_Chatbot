import React, { useState, useEffect } from 'react';
import Chat from '../components/Chat';
import Navbar from '../components/Navbar';
import HistorySidebar from '../components/HistorySidebar';

const ChatPage = () => {
    const [tokensLeft, setTokensLeft] = useState(() => {
        const stored = localStorage.getItem('tokens_left');
        return stored !== null ? parseInt(stored, 10) : 0;
    });
    const [recallPrompt, setRecallPrompt] = useState(null);
    const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem('tokens_left');
        if (stored !== null) setTokensLeft(parseInt(stored, 10));
    }, []);

    const handleTokensUpdate = (count) => {
        setTokensLeft(count);
        localStorage.setItem('tokens_left', String(count));
    };

    const handleHistoryUpdate = () => {
        setHistoryRefreshTrigger((t) => t + 1);
    };

    return (
        <div className="page chat-page">
            <Navbar tokensLeft={tokensLeft} />
            <div className="chat-page-layout">
                <HistorySidebar
                    isOpen={true}
                    refreshTrigger={historyRefreshTrigger}
                    onSelect={setRecallPrompt}
                />
                <main className="chat-page-main">
                    <Chat
                        onTokensUpdate={handleTokensUpdate}
                        recallPrompt={recallPrompt}
                        onClearRecall={() => setRecallPrompt(null)}
                        onHistoryUpdate={handleHistoryUpdate}
                    />
                </main>
            </div>
        </div>
    );
};

export default ChatPage;
