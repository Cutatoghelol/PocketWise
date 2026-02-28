'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Xin chào! 👋 Mình là trợ lý tài chính AI của PocketWise. Mình có thể giúp bạn:\n\n• Phân tích thói quen chi tiêu\n• Gợi ý cách tiết kiệm\n• Trả lời mọi câu hỏi về quản lý tài chính\n\nHãy hỏi mình bất cứ điều gì! 💰' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userMessage }],
                }),
            });

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply || 'Xin lỗi, mình không thể trả lời lúc này. Vui lòng thử lại sau.',
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Không thể kết nối AI. Vui lòng thử lại sau.',
            }]);
        }

        setLoading(false);
    };

    const quickQuestions = [
        'Phân tích chi tiêu tháng này',
        'Làm sao để tiết kiệm hiệu quả?',
        'Mình nên chi tiêu bao nhiêu mỗi ngày?',
        'Gợi ý cách quản lý tiền tiêu vặt',
    ];

    return (
        <div className={styles.chatContainer}>
            <div className="page-header">
                <h1>🤖 AI Tư vấn tài chính</h1>
                <p>Chat với AI để nhận lời khuyên quản lý chi tiêu cá nhân</p>
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
                <div className={styles.quickQuestions}>
                    {quickQuestions.map((q, i) => (
                        <button
                            key={i}
                            className={`glass-card ${styles.quickBtn}`}
                            onClick={() => { setInput(q); }}
                        >
                            💡 {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className={styles.messagesArea}>
                {messages.map((msg, i) => (
                    <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                        <div className={styles.messageAvatar}>
                            {msg.role === 'assistant' ? '🤖' : '👤'}
                        </div>
                        <div className={styles.messageBubble}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className={`${styles.message} ${styles.assistant}`}>
                        <div className={styles.messageAvatar}>🤖</div>
                        <div className={styles.messageBubble}>
                            <span className={styles.typing}>
                                <span></span><span></span><span></span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className={styles.inputArea} onSubmit={handleSend}>
                <input
                    type="text"
                    className={`input-field ${styles.chatInput}`}
                    placeholder="Nhập câu hỏi của bạn..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    className={`btn btn-primary ${styles.sendBtn}`}
                    disabled={loading || !input.trim()}
                >
                    📨
                </button>
            </form>
        </div>
    );
}
