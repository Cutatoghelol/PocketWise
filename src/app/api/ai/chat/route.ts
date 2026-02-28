import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages } = await request.json();

        // Get user's recent spending context
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, description, transaction_date, categories(name)')
            .eq('user_id', user.id)
            .gte('transaction_date', thirtyDaysAgo)
            .order('transaction_date', { ascending: false })
            .limit(50);

        const { data: profile } = await supabase
            .from('profiles')
            .select('monthly_budget, display_name')
            .eq('id', user.id)
            .single();

        const totalSpent = (transactions || []).reduce((s, t) => s + Number(t.amount), 0);
        const categoryTotals: Record<string, number> = {};
        (transactions || []).forEach(t => {
            const cat = (t.categories as { name: string } | null)?.name || 'Khác';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
        });

        const spendingContext = Object.entries(categoryTotals)
            .map(([cat, amt]) => `${cat}: ${amt.toLocaleString('vi-VN')}đ`)
            .join(', ');

        const systemPrompt = `Bạn là trợ lý tài chính AI thân thiện dành cho học sinh Việt Nam, tên là PocketWise AI. 

    Thông tin người dùng: 
    - Tên: ${profile?.display_name || 'Bạn'}
    - Ngân sách hàng tháng: ${Number(profile?.monthly_budget || 500000).toLocaleString('vi-VN')}đ
    - Tổng chi tiêu 30 ngày gần đây: ${totalSpent.toLocaleString('vi-VN')}đ
    - Chi tiêu theo danh mục: ${spendingContext || 'Chưa có dữ liệu'}
    - Số giao dịch: ${(transactions || []).length}

    Quy tắc:
    - Trả lời bằng tiếng Việt, thân thiện, ngắn gọn
    - Dùng emoji phù hợp
    - Đưa ra lời khuyên thiết thực cho học sinh
    - Nếu hỏi về chi tiêu, dựa vào dữ liệu thực tế ở trên
    - Không nói những gì không liên quan đến tài chính cá nhân
    - Khuyến khích thói quen tiết kiệm tốt`;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
            // Fallback response without AI
            const lastUserMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || '';
            let reply = '';

            if (lastUserMessage.includes('phân tích') || lastUserMessage.includes('chi tiêu')) {
                reply = `📊 Dựa trên dữ liệu của bạn:\n\n- Tổng chi 30 ngày: ${totalSpent.toLocaleString('vi-VN')}đ\n- Ngân sách: ${Number(profile?.monthly_budget || 500000).toLocaleString('vi-VN')}đ\n- Top chi tiêu: ${spendingContext || 'Chưa có dữ liệu'}\n\n💡 Hãy cố gắng giữ chi tiêu trong ngân sách nhé!`;
            } else if (lastUserMessage.includes('tiết kiệm')) {
                reply = '💰 Một số mẹo tiết kiệm cho học sinh:\n\n1. Ghi chép chi tiêu mỗi ngày\n2. Đặt ngân sách cho từng danh mục\n3. Áp dụng quy tắc 50-30-20\n4. Mang theo bình nước thay vì mua nước ngoài\n5. Tìm ưu đãi và khuyến mãi cho sinh viên';
            } else {
                reply = `Xin chào ${profile?.display_name || 'bạn'}! 👋\n\nMình có thể giúp bạn phân tích chi tiêu và đưa ra gợi ý tiết kiệm. Hãy thử hỏi:\n- "Phân tích chi tiêu tháng này"\n- "Làm sao để tiết kiệm?"\n\n⚠️ Để có trải nghiệm AI đầy đủ, hãy cấu hình OPENAI_API_KEY trong .env.local`;
            }

            return NextResponse.json({ reply });
        }

        const openai = new OpenAI({ apiKey });
        const chatMessages = [
            { role: 'system' as const, content: systemPrompt },
            ...(messages || []).slice(-10).map((m: { role: string; content: string }) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: chatMessages,
            max_tokens: 500,
            temperature: 0.7,
        });

        return NextResponse.json({
            reply: completion.choices[0]?.message?.content || 'Xin lỗi, mình không thể trả lời lúc này.',
        });
    } catch (error) {
        console.error('AI chat error:', error);
        return NextResponse.json({
            reply: '❌ Đã xảy ra lỗi. Vui lòng thử lại sau.',
        });
    }
}
