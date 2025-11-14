import { NextResponse } from 'next/server';

// 简单的测试端点，不需要认证
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'AI Modify API is working',
        timestamp: new Date().toISOString(),
    });
}

export async function POST() {
    // 测试默认修改生成
    const testInstruction = '请帮我修改文章，title 改成"火星探索"，然后将内容改成"火星探索的历史"';

    // 简单的标题匹配
    const titleMatch = testInstruction.match(/title.*?改成.*?["'"](.*?)["'"]/i) ||
        testInstruction.match(/标题.*?改成.*?["'"](.*?)["'"]/i) ||
        testInstruction.match(/标题.*?为.*?["'"](.*?)["'"]/i);

    // 简单的内容匹配
    const contentMatch = testInstruction.match(/内容.*?改成.*?["'"](.*?)["'"]/i) ||
        testInstruction.match(/content.*?to.*?["'"](.*?)["'"]/i);

    const modifications = [];

    if (titleMatch && titleMatch[1]) {
        modifications.push({
            type: 'update_title',
            title: titleMatch[1],
        });
    }

    if (contentMatch && contentMatch[1]) {
        modifications.push({
            type: 'replace',
            content: contentMatch[1],
        });
    }

    return NextResponse.json({
        testInstruction,
        modifications,
        explanation: '这是测试响应',
    });
}
