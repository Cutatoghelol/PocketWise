'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './savings.module.css';

interface SavingsGoal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    icon: string;
    deadline: string | null;
    is_completed: boolean;
}

const formatVND = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function SavingsPage() {
    const supabase = createClient();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [icon, setIcon] = useState('🎯');
    const [deadline, setDeadline] = useState('');
    const [addAmount, setAddAmount] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const loadGoals = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        setGoals((data || []) as SavingsGoal[]);
        setLoading(false);
    }, []);

    useEffect(() => { loadGoals(); }, [loadGoals]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            name,
            target_amount: Number(targetAmount),
            icon,
            deadline: deadline || null,
        };

        if (editGoal) {
            await supabase.from('savings_goals').update(payload).eq('id', editGoal.id);
        } else {
            await supabase.from('savings_goals').insert(payload);
        }

        resetForm();
        loadGoals();
    };

    const handleAddMoney = async (goalId: string) => {
        const amt = Number(addAmount[goalId] || 0);
        if (amt <= 0) return;

        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;

        const newAmount = Number(goal.current_amount) + amt;
        await supabase.from('savings_goals').update({
            current_amount: newAmount,
            is_completed: newAmount >= Number(goal.target_amount),
        }).eq('id', goalId);

        setAddAmount(prev => ({ ...prev, [goalId]: '' }));
        loadGoals();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa mục tiêu này?')) return;
        await supabase.from('savings_goals').delete().eq('id', id);
        loadGoals();
    };

    const resetForm = () => {
        setShowForm(false);
        setEditGoal(null);
        setName('');
        setTargetAmount('');
        setIcon('🎯');
        setDeadline('');
    };

    const icons = ['🎯', '🎮', '📱', '👟', '🎸', '📚', '✈️', '🎁', '💻', '🏖️'];

    return (
        <div>
            <div className="page-header">
                <h1>🎯 Mục tiêu tiết kiệm</h1>
                <p>Đặt mục tiêu và theo dõi tiến trình tiết kiệm của bạn</p>
            </div>

            <button
                className="btn btn-primary"
                onClick={() => { resetForm(); setShowForm(true); }}
                style={{ marginBottom: 'var(--space-lg)' }}
            >
                ➕ Tạo mục tiêu mới
            </button>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editGoal ? '✏️ Sửa mục tiêu' : '🎯 Mục tiêu mới'}</h2>
                            <button className="modal-close" onClick={resetForm}>&times;</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="input-label">Biểu tượng</label>
                                <div className={styles.iconPicker}>
                                    {icons.map(ic => (
                                        <button
                                            key={ic}
                                            type="button"
                                            className={`${styles.iconOption} ${icon === ic ? styles.iconActive : ''}`}
                                            onClick={() => setIcon(ic)}
                                        >
                                            {ic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="input-label">Tên mục tiêu</label>
                                <input
                                    className="input-field"
                                    placeholder="VD: Mua tai nghe mới"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Số tiền mục tiêu (VNĐ)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="500000"
                                    value={targetAmount}
                                    onChange={e => setTargetAmount(e.target.value)}
                                    required
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Hạn chót (tùy chọn)</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" className="btn btn-ghost" onClick={resetForm} style={{ flex: 1 }}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editGoal ? '💾 Cập nhật' : '✅ Tạo mục tiêu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Goals List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}
                </div>
            ) : goals.length > 0 ? (
                <div className={styles.goalsGrid}>
                    {goals.map(goal => {
                        const percent = Math.min(
                            (Number(goal.current_amount) / Number(goal.target_amount)) * 100,
                            100
                        );
                        return (
                            <div key={goal.id} className={`glass-card ${styles.goalCard}`}>
                                <div className={styles.goalHeader}>
                                    <span className={styles.goalIcon}>{goal.icon}</span>
                                    <div className={styles.goalInfo}>
                                        <h3>{goal.name}</h3>
                                        {goal.deadline && (
                                            <span className={styles.goalDeadline}>
                                                📅 {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                    {goal.is_completed && (
                                        <span className={`badge ${styles.completedBadge}`}>✅ Hoàn thành</span>
                                    )}
                                </div>

                                <div className={styles.goalProgress}>
                                    <div className={styles.goalAmounts}>
                                        <span>{formatVND(Number(goal.current_amount))}</span>
                                        <span className={styles.goalTarget}>/ {formatVND(Number(goal.target_amount))}</span>
                                    </div>
                                    <div className="progress-bar" style={{ height: '10px' }}>
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${percent}%`,
                                                background: goal.is_completed
                                                    ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                                    : 'var(--gradient-primary)',
                                            }}
                                        />
                                    </div>
                                    <span className={styles.goalPercent}>{percent.toFixed(0)}%</span>
                                </div>

                                {!goal.is_completed && (
                                    <div className={styles.goalActions}>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Thêm tiền..."
                                            value={addAmount[goal.id] || ''}
                                            onChange={e => setAddAmount(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                            style={{ flex: 1 }}
                                        />
                                        <button className="btn btn-primary btn-sm" onClick={() => handleAddMoney(goal.id)}>
                                            💰 Thêm
                                        </button>
                                    </div>
                                )}

                                <div className={styles.goalFooter}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => { setEditGoal(goal); setName(goal.name); setTargetAmount(String(goal.target_amount)); setIcon(goal.icon); setDeadline(goal.deadline || ''); setShowForm(true); }}
                                    >
                                        ✏️ Sửa
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(goal.id)}>
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card empty-state">
                    <div className="empty-icon">🎯</div>
                    <h3>Chưa có mục tiêu tiết kiệm</h3>
                    <p>Hãy tạo mục tiêu đầu tiên để bắt đầu tiết kiệm!</p>
                </div>
            )}
        </div>
    );
}
