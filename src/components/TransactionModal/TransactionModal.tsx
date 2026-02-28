'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface Props {
    onClose: () => void;
    onSaved: () => void;
    editTransaction?: {
        id: string;
        amount: number;
        description: string;
        transaction_date: string;
        category_id: string;
    };
}

export default function TransactionModal({ onClose, onSaved, editTransaction }: Props) {
    const supabase = createClient();
    const [categories, setCategories] = useState<Category[]>([]);
    const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : '');
    const [description, setDescription] = useState(editTransaction?.description || '');
    const [categoryId, setCategoryId] = useState(editTransaction?.category_id || '');
    const [date, setDate] = useState(editTransaction?.transaction_date || new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadCategories() {
            const { data } = await supabase.from('categories').select('*').order('name');
            if (data) {
                setCategories(data);
                if (!categoryId && data.length > 0) setCategoryId(data[0].id);
            }
        }
        loadCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            user_id: user.id,
            amount: Number(amount),
            description,
            category_id: categoryId,
            transaction_date: date,
        };

        let result;
        if (editTransaction) {
            result = await supabase
                .from('transactions')
                .update(payload)
                .eq('id', editTransaction.id);
        } else {
            result = await supabase.from('transactions').insert(payload);
        }

        if (result.error) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
            setLoading(false);
        } else {
            onSaved();
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editTransaction ? '✏️ Sửa giao dịch' : '➕ Thêm giao dịch mới'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                {error && <div className="alert alert-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="input-label">Số tiền (VNĐ)</label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="15000"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="1"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Danh mục</label>
                        <select
                            className="input-field"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Mô tả</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Trà sữa, sách, xe buýt..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="input-label">Ngày</label>
                        <input
                            type="date"
                            className="input-field"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                            {loading ? '⏳ Đang lưu...' : editTransaction ? '💾 Cập nhật' : '✅ Thêm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
