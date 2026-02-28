'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import styles from '../login/auth.module.css';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
        } else {
            setSent(true);
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authLogo}>🔑</span>
                    <h1>Quên mật khẩu</h1>
                    <p>Nhập email để nhận liên kết đặt lại mật khẩu</p>
                </div>

                {error && (
                    <div className="alert alert-error">⚠️ {error}</div>
                )}

                {sent ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Đã gửi email!</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Kiểm tra hộp thư <strong>{email}</strong> và nhấn vào liên kết để đặt lại mật khẩu.
                            <br /><br />
                            Không thấy email? Hãy kiểm tra thư mục Spam.
                        </p>
                        <button
                            className="btn btn-ghost"
                            onClick={() => { setSent(false); setEmail(''); }}
                            style={{ marginTop: '16px' }}
                        >
                            🔄 Gửi lại
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleReset}>
                        <div className="form-group">
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="ten@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className={`btn btn-primary btn-lg ${styles.authBtn}`}
                            disabled={loading}
                        >
                            {loading ? '⏳ Đang gửi...' : '📧 Gửi liên kết đặt lại'}
                        </button>
                    </form>
                )}

                <p className={styles.authSwitch}>
                    Nhớ mật khẩu?{' '}
                    <Link href="/login">Đăng nhập</Link>
                </p>
            </div>

            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />
            <div className={styles.bgOrb3} />
        </div>
    );
}
