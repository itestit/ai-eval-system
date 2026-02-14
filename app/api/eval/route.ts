import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { input, type = 'SUGGESTION' } = await req.json()

    if (!input?.trim()) {
      return Response.json({ error: '输入不能为空' }, { status: 400 })
    }

    // Check remaining evaluations
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { remainingEvals: true },
    })

    if (!user || user.remainingEvals <= 0) {
      return Response.json({ error: '评测次数已用尽' }, { status: 403 })
    }

    // Get active model configuration
    const model = await prisma.aIModel.findFirst({
      where: { isActive: true },
    })

    if (!model) {
      return Response.json({ error: '未配置AI模型' }, { status: 500 })
    }

    // Get prompt template
    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { type },
    })

    // Build system prompt
    let systemPrompt = promptTemplate?.systemPrompt || 
      '你是一个专业的文本评测助手。请对用户输入的文本进行详细分析，给出建设性的建议和评价。'

    // Process file references (RAG-Lite)
    if (promptTemplate?.attachedFiles?.length) {
      const files = await prisma.knowledgeFile.findMany({
        where: { id: { in: promptTemplate.attachedFiles } },
      })
      
      for (const file of files) {
        const placeholder = `@${file.name}`
        if (systemPrompt.includes(placeholder) && file.content) {
          systemPrompt = systemPrompt.replace(placeholder, file.content)
        }
      }
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: model.apiKey,
      baseURL: model.baseUrl || undefined,
    })

    // Create chat completion
    const response = await openai.chat.completions.create({
      model: model.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
      stream: true,
    })

    // Create stream with logging
    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        // Calculate approximate tokens
        const tokensUsed = Math.ceil((input.length + completion.length) / 4)
        
        // Deduct one evaluation and log
        await prisma.$transaction([
          prisma.user.update({
            where: { id: session.userId },
            data: { remainingEvals: { decrement: 1 } },
          }),
          prisma.evalLog.create({
            data: {
              userId: session.userId,
              type,
              input: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
              output: completion,
              tokensUsed,
              modelId: model.id,
            },
          }),
        ])
      },
    })

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('评测错误:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    
    return Response.json(
      { error: '评测服务暂时不可用' },
      { status: 500 }
    )
  }
}
