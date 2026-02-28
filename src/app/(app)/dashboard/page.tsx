'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import TransactionModal from '@/components/TransactionModal/TransactionModal';
import styles from './dashboard.module.css';

interface Transaction {
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    category_id: string;
    categories: { name: string; icon: string; color: string } | null;
}

interface DailySpend { name: string; amount: number; }
interface CategorySpend { name: string; value: number; color: string; icon: string; }

const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const CHART_COLORS = ['#f97316', '#3b82f6', '#a855f7', '#22c55e', '#ec4899', '#6b7280'];

export default function DashboardPage() {
    const supabase = createClient();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dailyData, setDailyData] = useState<DailySpend[]>([]);
    const [categoryData, setCategoryData] = useState<CategorySpend[]>([]);
    const [todayTotal, setTodayTotal] = useState(0);
    const [weekTotal, setWeekTotal] = useState(0);
    const [monthTotal, setMonthTotal] = useState(0);
    const [monthBudget, setMonthBudget] = useState(500000);
    const [showModal, setShowModal] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile for budget
        const { data: profile } = await supabase
            .from('profiles')
            .select('monthly_budget')
            .eq('id', user.id)
            .single();
        if (profile) setMonthBudget(Number(profile.monthly_budget));

        // Get transactions for this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];

        const { data: txns } = await supabase
            .from('transactions')
            .select('*, categories(name, icon, color)')
            .eq('user_id', user.id)
            .gte('transaction_date', monthStart)
            .order('transaction_date', { ascending: false });

        const allTxns = (txns || []) as Transaction[];
        setTransactions(allTxns);

        // Calculate totals
        const tToday = allTxns
            .filter(t => t.transaction_date === today)
            .reduce((s, t) => s + Number(t.amount), 0);
        const tWeek = allTxns
            .filter(t => t.transaction_date >= weekAgo)
            .reduce((s, t) => s + Number(t.amount), 0);
        const tMonth = allTxns.reduce((s, t) => s + Number(t.amount), 0);

        setTodayTotal(tToday);
        setWeekTotal(tWeek);
        setMonthTotal(tMonth);

        // Daily chart data (last 7 days)
        const days: DailySpend[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86400000);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('vi-VN', { weekday: 'short' });
            const amount = allTxns
                .filter(t => t.transaction_date === dateStr)
                .reduce((s, t) => s + Number(t.amount), 0);
            days.push({ name: dayName, amount });
        }
        setDailyData(days);

        // Category chart data
        const catMap = new Map<string, CategorySpend>();
        allTxns.forEach(t => {
            const catName = t.categories?.name || 'Khác';
            const existing = catMap.get(catName);
            if (existing) {
                existing.value += Number(t.amount);
            } else {
                catMap.set(catName, {
                    name: catName,
                    value: Number(t.amount),
                    color: t.categories?.color || '#6b7280',
                    icon: t.categories?.icon || '📦',
                });
            }
        });
        setCategoryData(Array.from(catMap.values()));
        setLoading(false);
    }, []);

    const loadAiInsight = async () => {
        setAiLoading(true);
        try {
            const res = await fetch('/api/ai/analyze', { method: 'POST' });
            const data = await res.json();
            setAiInsight(data.insight || 'Chưa có đủ dữ liệu để phân tích.');
        } catch {
            setAiInsight('Không thể kết nối AI. Vui lòng thử lại sau.');
        }
        setAiLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    const budgetPercent = monthBudget > 0 ? Math.min((monthTotal / monthBudget) * 100, 100) : 0;

    return (
        <div>
            <div className="page-header">
                <h1>📊 Tổng quan chi tiêu</h1>
                <p>Theo dõi và quản lý tiền tiêu vặt thông minh hơn mỗi ngày</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-value">{formatVND(todayTotal)}</div>
                    <div className="stat-label">Hôm nay</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{formatVND(weekTotal)}</div>
                    <div className="stat-label">Tuần này</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon">📆</div>
                    <div className="stat-value">{formatVND(monthTotal)}</div>
                    <div className="stat-label">Tháng này</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{budgetPercent.toFixed(0)}%</div>
                    <div className="stat-label">Ngân sách đã dùng</div>
                    <div className="progress-bar" style={{ marginTop: '8px' }}>
                        <div
                            className="progress-fill"
                            style={{
                                width: `${budgetPercent}%`,
                                background: budgetPercent > 80
                                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                    : 'var(--gradient-primary)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="glass-card chart-card">
                    <h3>📈 Chi tiêu 7 ngày qua</h3>
                    {loading ? (
                        <div className="skeleton" style={{ height: 200 }} />
                    ) : dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dailyData}>
                                <XAxis dataKey="name" stroke="#6b6b8a" fontSize={12} />
                                <YAxis stroke="#6b6b8a" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(20,20,50,0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#f0f0ff',
                                    }}
                                    formatter={(value: number) => [formatVND(value), 'Chi tiêu']}
                                />
                                <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7c3aed" />
                                        <stop offset="100%" stopColor="#3b82f6" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <h3>Chưa có dữ liệu</h3>
                            <p>Hãy thêm giao dịch để xem biểu đồ</p>
                        </div>
                    )}
                </div>

                <div className="glass-card chart-card">
                    <h3>🍩 Phân bổ theo danh mục</h3>
                    {loading ? (
                        <div className="skeleton" style={{ height: 200 }} />
                    ) : categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(20,20,50,0.95)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#f0f0ff',
                                    }}
                                    formatter={(value: number) => [formatVND(value), 'Chi tiêu']}
                                />
                                <Legend
                                    formatter={(value) => <span style={{ color: '#a0a0c0', fontSize: '0.8rem' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🍩</div>
                            <h3>Chưa có dữ liệu</h3>
                            <p>Hãy thêm giao dịch để xem biểu đồ</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Insights */}
            <div className={`glass-card ${styles.aiCard}`}>
                <div className={styles.aiHeader}>
                    <h3>🤖 AI Phân tích chi tiêu</h3>
                    <button className="btn btn-ghost btn-sm" onClick={loadAiInsight} disabled={aiLoading}>
                        {aiLoading ? '⏳ Đang phân tích...' : '🔄 Phân tích'}
                    </button>
                </div>
                <div className={styles.aiContent}>
                    {aiInsight ? (
                        <p>{aiInsight}</p>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>
                            Nhấn &quot;Phân tích&quot; để AI đánh giá thói quen chi tiêu của bạn và đưa ra gợi ý tiết kiệm.
                        </p>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className={`glass-card ${styles.recentCard}`}>
                <div className={styles.recentHeader}>
                    <h3>💸 Giao dịch gần đây</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        + Thêm
                    </button>
                </div>
                <div className="transaction-list">
                    {transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="transaction-item">
                            <div
                                className="transaction-icon"
                                style={{ background: `${tx.categories?.color || '#6b7280'}22` }}
                            >
                                {tx.categories?.icon || '📦'}
                            </div>
                            <div className="transaction-info">
                                <div className="tx-desc">{tx.description || tx.categories?.name || 'Giao dịch'}</div>
                                <div className="tx-category">
                                    {tx.categories?.name} • {new Date(tx.transaction_date).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                            <div className="transaction-amount">-{formatVND(Number(tx.amount))}</div>
                        </div>
                    ))}
                    {transactions.length === 0 && !loading && (
                        <div className="empty-state">
                            <div className="empty-icon">📝</div>
                            <h3>Chưa có giao dịch nào</h3>
                            <p>Nhấn &quot;+ Thêm&quot; để bắt đầu ghi chép chi tiêu</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Modal */}
            {showModal && (
                <TransactionModal
                    onClose={() => setShowModal(false)}
                    onSaved={() => {
                        setShowModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
