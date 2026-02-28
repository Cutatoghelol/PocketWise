'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';

const navItems = [
    { href: '/dashboard', icon: '📊', label: 'Tổng quan' },
    { href: '/transactions', icon: '💸', label: 'Giao dịch' },
    { href: '/savings', icon: '🎯', label: 'Tiết kiệm' },
    { href: '/chat', icon: '🤖', label: 'AI Tư vấn' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{ email?: string; display_name?: string } | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMsg, setPwMsg] = useState('');
    const [pwError, setPwError] = useState('');
    const supabase = createClient();

    useEffect(() => {
        async function getUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', authUser.id)
                    .single();
                setUser({
                    email: authUser.email,
                    display_name: profile?.display_name || authUser.email,
                });
            }
        }
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        setPwMsg('');

        if (newPw.length < 6) { setPwError('Mật khẩu mới phải có ít nhất 6 ký tự.'); return; }
        if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp.'); return; }

        setPwLoading(true);
        // Verify current password by re-signing in
        const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: user?.email || '',
            password: currentPw,
        });
        if (signInErr) {
            setPwError('Mật khẩu hiện tại không đúng.');
            setPwLoading(false);
            return;
        }

        const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
        if (updateErr) {
            setPwError(updateErr.message);
        } else {
            setPwMsg('Đổi mật khẩu thành công!');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setTimeout(() => { setShowPasswordModal(false); setPwMsg(''); }, 1500);
        }
        setPwLoading(false);
    };

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className={styles.mobileToggle}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                {mobileOpen ? '✕' : '☰'}
            </button>

            {/* Overlay for mobile */}
            {mobileOpen && (
                <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>💰</span>
                    {!collapsed && <span className={styles.logoText}>PocketWise</span>}
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* User Info & Actions */}
                <div className={styles.footer}>
                    {!collapsed && user && (
                        <div className={styles.userInfo}>
                            <div className={styles.avatar}>
                                {(user.display_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userDetails}>
                                <span className={styles.userName}>{user.display_name}</span>
                                <span className={styles.userEmail}>{user.email}</span>
                            </div>
                        </div>
                    )}
                    <button
                        className={styles.collapseBtn}
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                    >
                        {collapsed ? '➡️' : '⬅️'}
                    </button>
                    <button
                        className={styles.logoutBtn}
                        onClick={() => { setShowPasswordModal(true); setPwError(''); setPwMsg(''); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                        title="Đổi mật khẩu"
                    >
                        🔒
                    </button>
                    <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
                        🚪
                    </button>
                </div>
            </aside>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPasswordModal(false)}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>🔒 Đổi mật khẩu</h2>
                            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>&times;</button>
                        </div>
                        {pwMsg && <div className="alert alert-success">✅ {pwMsg}</div>}
                        {pwError && <div className="alert alert-error">⚠️ {pwError}</div>}
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label className="input-label">Mật khẩu hiện tại</label>
                                <input type="password" className="input-field" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Mật khẩu mới</label>
                                <input type="password" className="input-field" placeholder="Ít nhất 6 ký tự" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Xác nhận mật khẩu mới</label>
                                <input type="password" className="input-field" placeholder="••••••••" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowPasswordModal(false)} style={{ flex: 1 }}>Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ flex: 1 }}>{pwLoading ? '⏳...' : '💾 Lưu'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
