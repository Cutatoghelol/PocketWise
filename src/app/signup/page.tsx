'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/auth.module.css';

export default function SignupPage() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            setLoading(false);
            return;
        }

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                },
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <span className={styles.authLogo}>💰</span>
                    <h1>Tạo tài khoản</h1>
                    <p>Bắt đầu quản lý chi tiêu thông minh ngay hôm nay</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label className="input-label">Tên hiển thị</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Nguyễn Văn A"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="ten@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Mật khẩu</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Ít nhất 6 ký tự"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        className={`btn btn-primary btn-lg ${styles.authBtn}`}
                        disabled={loading}
                    >
                        {loading ? '⏳ Đang tạo tài khoản...' : '✨ Đăng ký miễn phí'}
                    </button>
                </form>

                <p className={styles.authSwitch}>
                    Đã có tài khoản?{' '}
                    <Link href="/login">Đăng nhập</Link>
                </p>
            </div>

            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />
            <div className={styles.bgOrb3} />
        </div>
    );
}
