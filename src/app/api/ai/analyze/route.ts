import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's transactions for the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, description, transaction_date, categories(name)')
            .eq('user_id', user.id)
            .gte('transaction_date', thirtyDaysAgo)
            .order('transaction_date', { ascending: false });

        // Get profile for budget info
        const { data: profile } = await supabase
            .from('profiles')
            .select('monthly_budget, display_name')
            .eq('id', user.id)
            .single();

        if (!transactions || transactions.length === 0) {
            return NextResponse.json({
                insight: 'Bạn chưa có giao dịch nào trong 30 ngày qua. Hãy bắt đầu ghi chép chi tiêu hàng ngày để AI có thể phân tích và đưa ra gợi ý hữu ích cho bạn! 📝',
            });
        }

        // Summarize spending data
        const totalSpent = transactions.reduce((s, t) => s + Number(t.amount), 0);
        const categoryTotals: Record<string, number> = {};
        transactions.forEach(t => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cats = t.categories as any;
            const cat = (Array.isArray(cats) ? cats[0]?.name : cats?.name) || 'Khác';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
        });

        const spendingSummary = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => `- ${cat}: ${amt.toLocaleString('vi-VN')}đ (${((amt / totalSpent) * 100).toFixed(1)}%)`)
            .join('\n');

        const prompt = `Bạn là chuyên gia tài chính dành cho học sinh Việt Nam. Phân tích chi tiêu sau và đưa ra nhận xét ngắn gọn, thân thiện:

Tên: ${profile?.display_name || 'Bạn'}
Ngân sách tháng: ${Number(profile?.monthly_budget || 500000).toLocaleString('vi-VN')}đ
Tổng chi tiêu 30 ngày: ${totalSpent.toLocaleString('vi-VN')}đ
Số giao dịch: ${transactions.length}

Chi tiêu theo danh mục:
${spendingSummary}

Hãy:
1. Nhận xét thói quen chi tiêu (1-2 câu)
2. Chỉ ra danh mục chi tiêu nhiều nhất và gợi ý cải thiện (1-2 câu)
3. Đưa ra 1 mẹo tiết kiệm cụ thể phù hợp với học sinh (1 câu)

Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, dùng emoji.`;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
            // Fallback: generate a basic insight without AI
            const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
            const budgetPercent = ((totalSpent / Number(profile?.monthly_budget || 500000)) * 100).toFixed(0);
            return NextResponse.json({
                insight: `📊 Tổng chi tiêu 30 ngày: ${totalSpent.toLocaleString('vi-VN')}đ (${budgetPercent}% ngân sách)\n\n🏷️ Chi nhiều nhất: ${topCategory[0]} (${topCategory[1].toLocaleString('vi-VN')}đ - ${((topCategory[1] / totalSpent) * 100).toFixed(0)}%)\n\n💡 Mẹo: Hãy thử ghi chép chi tiêu mỗi ngày và đặt giới hạn cho từng danh mục để tiết kiệm hiệu quả hơn!\n\n⚠️ Để nhận phân tích AI chi tiết hơn, hãy cấu hình OPENAI_API_KEY trong file .env.local`,
            });
        }

        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: 0.7,
        });

        return NextResponse.json({
            insight: completion.choices[0]?.message?.content || 'Không thể phân tích lúc này.',
        });
    } catch (error) {
        console.error('AI analyze error:', error);
        return NextResponse.json({
            insight: '❌ Đã xảy ra lỗi khi phân tích. Vui lòng thử lại sau.',
        });
    }
}
