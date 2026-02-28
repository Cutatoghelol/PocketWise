'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import TransactionModal from '@/components/TransactionModal/TransactionModal';
import styles from './transactions.module.css';

interface Transaction {
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    category_id: string;
    categories: { name: string; icon: string; color: string } | null;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function TransactionsPage() {
    const supabase = createClient();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMonth, setFilterMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [showModal, setShowModal] = useState(false);
    const [editTx, setEditTx] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Load categories
        const { data: cats } = await supabase.from('categories').select('id, name, icon').order('name');
        if (cats) setCategories(cats);

        // Load transactions — build date range manually to avoid timezone issues
        const [year, month] = filterMonth.split('-').map(Number);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        let query = supabase
            .from('transactions')
            .select('*, categories(name, icon, color)')
            .eq('user_id', user.id)
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate)
            .order('transaction_date', { ascending: false });

        if (filterCategory !== 'all') {
            query = query.eq('category_id', filterCategory);
        }

        const { data: txns, error } = await query;
        if (error) console.error('Transaction load error:', error);
        setTransactions((txns || []) as Transaction[]);
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterMonth, filterCategory]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
        await supabase.from('transactions').delete().eq('id', id);
        loadData();
    };

    const totalFiltered = transactions.reduce((s, t) => s + Number(t.amount), 0);

    // Group by date
    const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
        const d = tx.transaction_date;
        if (!acc[d]) acc[d] = [];
        acc[d].push(tx);
        return acc;
    }, {});

    return (
        <div>
            <div className="page-header">
                <h1>💸 Lịch sử giao dịch</h1>
                <p>Xem và quản lý tất cả khoản chi tiêu của bạn</p>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <input
                        type="month"
                        className="input-field"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    />
                    <select
                        className="input-field"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">📁 Tất cả danh mục</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowModal(true); }}>
                    ➕ Thêm giao dịch
                </button>
            </div>

            {/* Summary */}
            <div className={`glass-card ${styles.summary}`}>
                <span>Tổng chi tiêu: <strong>{formatVND(totalFiltered)}</strong></span>
                <span className={styles.txCount}>{transactions.length} giao dịch</span>
            </div>

            {/* Transaction List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
                </div>
            ) : Object.keys(grouped).length > 0 ? (
                Object.entries(grouped).map(([date, txns]) => (
                    <div key={date} className={styles.dateGroup}>
                        <div className={styles.dateLabel}>
                            📅 {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div className="transaction-list">
                            {txns.map(tx => (
                                <div key={tx.id} className="transaction-item" onClick={() => { setEditTx(tx); setShowModal(true); }}>
                                    <div
                                        className="transaction-icon"
                                        style={{ background: `${tx.categories?.color || '#6b7280'}22` }}
                                    >
                                        {tx.categories?.icon || '📦'}
                                    </div>
                                    <div className="transaction-info">
                                        <div className="tx-desc">{tx.description || tx.categories?.name || 'Giao dịch'}</div>
                                        <div className="tx-category">{tx.categories?.name}</div>
                                    </div>
                                    <div className="transaction-amount">-{formatVND(Number(tx.amount))}</div>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                        title="Xóa"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="glass-card empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>Không tìm thấy giao dịch</h3>
                    <p>Thử thay đổi bộ lọc hoặc thêm giao dịch mới</p>
                </div>
            )}

            {showModal && (
                <TransactionModal
                    onClose={() => { setShowModal(false); setEditTx(null); }}
                    onSaved={() => { setShowModal(false); setEditTx(null); loadData(); }}
                    editTransaction={editTx ? {
                        id: editTx.id,
                        amount: editTx.amount,
                        description: editTx.description,
                        transaction_date: editTx.transaction_date,
                        category_id: editTx.category_id,
                    } : undefined}
                />
            )}
        </div>
    );
}
