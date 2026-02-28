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
                    <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
                        🚪
                    </button>
                </div>
            </aside>
        </>
    );
}
