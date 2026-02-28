'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './auth.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
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
                    <h1>PocketWise</h1>
                    <p>Đăng nhập để quản lý chi tiêu thông minh</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
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
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className={`btn btn-primary btn-lg ${styles.authBtn}`}
                        disabled={loading}
                    >
                        {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
                    </button>
                </form>

                <p className={styles.authSwitch}>
                    Chưa có tài khoản?{' '}
                    <Link href="/signup">Đăng ký ngay</Link>
                </p>
            </div>

            {/* Decorative elements */}
            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />
            <div className={styles.bgOrb3} />
        </div>
    );
}
