import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import { api } from '../services/api';
import './Chat.css';

/** Convert markdown to PDF-friendly structured text: bullets, section headers, clean */
function markdownToStructuredText(md) {
    if (!md || typeof md !== 'string') return '';
    const bullet = '\u2022';
    const section = '\u2022'; // section header (will be drawn bold)
    return md
        .replace(/^###\s+(.+)$/gm, `\n  ${bullet} $1`)
        .replace(/^##\s+(.+)$/gm, `\n\n${section} $1\n`)
        .replace(/^#\s+(.+)$/gm, `\n\n${section} $1\n`)
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^[-*]\s+/gm, `  ${bullet} `)
        .replace(/^(\d+)\.\s+/gm, '  $1. ')
        .replace(/>\s*/g, '')
        .replace(/\|/g, ' ')
        .replace(/[\u00d8=\u00de\u20ac]/g, '') // remove stray chars like Ø=Þ€
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Draw structured content (bullets, headers, spacing) and return new y */
function addStructuredContent(doc, text, opts) {
    const { margin, maxWidth, lineHeight } = opts;
    let y = opts.y;
    const bullet = '\u2022';
    const lineHeightSmall = lineHeight;

    const addPageIfNeeded = (space = 25) => {
        if (y + space > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
    };

    const drawLine = (lineText, indent, bold, fontSize = 10) => {
        addPageIfNeeded(lineHeight * 4);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(0, 0, 0);
        const wrapWidth = maxWidth - indent;
        const lines = doc.splitTextToSize(lineText, wrapWidth);
        doc.text(lines, margin + indent, y);
        y += lines.length * lineHeightSmall;
    };

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();
        if (!trimmed) {
            y += lineHeight * 0.8;
            continue;
        }
        const prevEmpty = i === 0 || lines[i - 1].trim() === '';
        const isSection = trimmed.startsWith(bullet) && trimmed.length < 55 && prevEmpty;
        const isBullet = /^\s*\u2022\s/.test(raw) || /^\s*\d+\.\s/.test(raw);
        const indent = isBullet ? 10 : 0;
        drawLine(trimmed, indent, isSection, isSection ? 11 : 10);
    }
    return y;
}

function exportChatToPdf(messages) {
    const doc = new jsPDF();
    const margin = 22;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;
    const lineHeight = 5.5;
    const sectionGap = 12;

    const addPageIfNeeded = (requiredSpace = 35) => {
        if (y + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
    };

    const addText = (text, options = {}) => {
        const { bold = false, fontSize = 10, indent = 0, color = null } = options;
        if (color) doc.setTextColor(color[0], color[1], color[2]);
        else doc.setTextColor(0, 0, 0);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, maxWidth - indent);
        doc.text(lines, margin + indent, y);
        y += lines.length * lineHeight;
    };

    const addSpace = (space = sectionGap) => {
        y += space;
        addPageIfNeeded();
    };

    // Title with simple icon-style
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 80);
    doc.text('Your Genie \u2014 Chat Export', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 110);
    doc.text('Exported on: ' + new Date().toLocaleString(), margin, y);
    y += 8;

    doc.setDrawColor(180, 180, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += sectionGap;

    if (!messages || messages.length === 0) {
        addText('No messages in this chat.');
        doc.save('chat-export-' + new Date().toISOString().slice(0, 10) + '.pdf');
        return;
    }

    doc.setTextColor(0, 0, 0);

    messages.forEach((msg) => {
        addPageIfNeeded(40);
        if (msg.sender === 'user') {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(80, 70, 130);
            doc.text('User', margin, y);
            y += lineHeight + 2;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const userLines = doc.splitTextToSize(msg.text, maxWidth);
            doc.text(userLines, margin, y);
            y += userLines.length * lineHeight + 4;
        } else {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(70, 90, 140);
            doc.text('Genie', margin, y);
            y += lineHeight + 2;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            y = addStructuredContent(doc, markdownToStructuredText(msg.text), {
                margin,
                maxWidth,
                lineHeight,
                sectionGap,
                y,
            });
            if (Array.isArray(msg.sources) && msg.sources.length > 0) {
                const validSources = msg.sources.filter((s) => s && s.url);
                if (validSources.length > 0) {
                    addSpace(6);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(50, 50, 70);
                    doc.text('Sources', margin, y);
                    y += lineHeight + 2;
                    doc.setFont('helvetica', 'normal');
                    validSources.forEach((s, i) => {
                        addPageIfNeeded(20);
                        doc.setFontSize(9);
                        doc.setTextColor(0, 0, 0);
                        const title = (s.title || s.url).trim();
                        const titleLines = doc.splitTextToSize((i + 1) + '. ' + title, maxWidth - 12);
                        doc.text(titleLines, margin + 8, y);
                        y += titleLines.length * (lineHeight - 0.5) + 2;
                        doc.setTextColor(30, 100, 200);
                        const urlLines = doc.splitTextToSize(s.url, maxWidth - 12);
                        const linkTop = y - 3;
                        doc.text(urlLines, margin + 8, y);
                        const linkH = urlLines.length * (lineHeight - 0.5) + 4;
                        try {
                            doc.link(margin + 8, linkTop, maxWidth - 12, linkH, { url: s.url });
                        } catch (_) {}
                        y += linkH + 2;
                        doc.setTextColor(0, 0, 0);
                    });
                    doc.setFontSize(10);
                }
            }
            addSpace(2);
        }
    });

    doc.save('chat-export-' + new Date().toISOString().slice(0, 10) + '.pdf');
}

const TypingIndicator = () => (
    <div className="message bot message-typing">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
    </div>
);

const CodeBlock = ({ className, children }) => {
    const code = String(children ?? '').replace(/\n$/, '');
    const lang = className?.replace('language-', '') || 'text';
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="md-code-block">
            <div className="md-code-header">
                <span className="md-code-lang">{lang}</span>
                <button type="button" className="md-code-copy" onClick={copyCode} title="Copy code">
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre><code className={className}>{children}</code></pre>
        </div>
    );
};

function getCodeFromPre(children) {
    const codeEl = Array.isArray(children) ? children[0] : children;
    if (codeEl?.props?.className) {
        return { className: codeEl.props.className, children: codeEl.props.children };
    }
    return null;
}

const BotMessage = ({ text, isError, sources = [] }) => {
    const validSources = Array.isArray(sources)
        ? sources.filter(s => s && s.url && typeof s.url === 'string' && s.url.startsWith('http'))
        : [];

    return (
        <div className={`message bot ${isError ? 'message-error' : ''}`}>
            <div className="message-markdown chatgpt-style">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({ children }) => <p>{children}</p>,
                        ul: ({ children }) => <ul>{children}</ul>,
                        ol: ({ children }) => <ol>{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong>{children}</strong>,
                        em: ({ children }) => <em>{children}</em>,
                        a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                        ),
                        blockquote: ({ children }) => <blockquote>{children}</blockquote>,
                        hr: () => <hr />,
                        table: ({ children }) => <div className="md-table-wrap"><table>{children}</table></div>,
                        thead: ({ children }) => <thead>{children}</thead>,
                        tbody: ({ children }) => <tbody>{children}</tbody>,
                        tr: ({ children }) => <tr>{children}</tr>,
                        th: ({ children }) => <th>{children}</th>,
                        td: ({ children }) => <td>{children}</td>,
                        pre: ({ children }) => {
                            const codeData = getCodeFromPre(children);
                            if (codeData) {
                                return <CodeBlock className={codeData.className}>{codeData.children}</CodeBlock>;
                            }
                            return <pre>{children}</pre>;
                        },
                        code: ({ className, inline, children }) => {
                            if (inline) return <code>{children}</code>;
                            return <code className={className}>{children}</code>;
                        },
                        h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
                        h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
                        h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
                    }}
                >
                    {text}
                </ReactMarkdown>
            </div>
            {validSources.length > 0 && (
                <div className="message-sources">
                    <span className="message-sources-label">Sources</span>
                    <ul className="message-sources-list">
                        {validSources.map((source, idx) => (
                            <li key={idx}>
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="message-sources-link"
                                >
                                    {source.title || source.url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const Chat = ({ onTokensUpdate, recallPrompt, onClearRecall, onHistoryUpdate }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
        scrollToBottom();
    }, [messages, navigate]);

    useEffect(() => {
        if (recallPrompt) {
            setInput(recallPrompt);
            if (typeof onClearRecall === 'function') onClearRecall();
        }
    }, [recallPrompt]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input.trim(), sender: 'user' };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await api.post(
                '/chat',
                { prompt: userMessage.text },
                { headers: { 'x-auth-token': token } }
            );

            const botMessage = {
                text: res.data.response,
                sender: 'bot',
                isError: false,
                sources: res.data.sources || [],
            };
            setMessages((prev) => [...prev, botMessage]);
            if (typeof res.data.tokens_left === 'number' && typeof onTokensUpdate === 'function') {
                onTokensUpdate(res.data.tokens_left);
            }
            if (typeof onHistoryUpdate === 'function') onHistoryUpdate();
        } catch (err) {
            console.error(err);
            let errorText = 'Could not get response. Please try again.';
            if (err.response?.status === 401 || err.response?.status === 403) {
                errorText = 'Session expired or no tokens left. Please sign in again.';
                if (err.response?.status === 401) navigate('/');
            }
            setMessages((prev) => [
                ...prev,
                { text: errorText, sender: 'bot', isError: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.length === 0 && (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon">✨</div>
                        <h2>Your Genie</h2>
                        <p>Ask me anything — tips, explanations, or step-by-step help. I&apos;ll reply with clear, formatted answers.</p>
                        <div className="chat-suggestions">
                            <span>Try:</span>
                            <button type="button" onClick={() => setInput('How do I learn React?')}>
                                How do I learn React?
                            </button>
                            <button type="button" onClick={() => setInput('Explain async/await in JavaScript')}>
                                Explain async/await
                            </button>
                            <button type="button" onClick={() => setInput('Give me 5 productivity tips')}>
                                5 productivity tips
                            </button>
                        </div>
                    </div>
                )}
                {messages.map((msg, idx) =>
                    msg.sender === 'bot' ? (
                        <BotMessage key={idx} text={msg.text} isError={msg.isError} sources={msg.sources} />
                    ) : (
                        <div key={idx} className="message user">
                            {msg.text}
                        </div>
                    )
                )}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-area">
                <div className="input-area-row">
                    <button
                        type="button"
                        className="export-pdf-btn"
                        onClick={() => exportChatToPdf(messages)}
                        disabled={loading || messages.length === 0}
                        title="Export chat to PDF"
                    >
                        Export chat to PDF
                    </button>
                    <div className="input-area-input-wrap">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            disabled={loading}
                        />
                        <button type="button" onClick={sendMessage} disabled={loading} className="send-btn">
                            {loading ? (
                                <span className="btn-loading">...</span>
                            ) : (
                                <span className="btn-send-icon">↑</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
