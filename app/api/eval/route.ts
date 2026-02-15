import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

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

    // Create chat completion with streaming
    const response = await openai.chat.completions.create({
      model: model.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
      stream: true,
    })

    // Build response stream
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content
              // Send as SSE format
              const data = `data: ${JSON.stringify({ content })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          
          // Log completion and deduct credits
          const tokensUsed = Math.ceil((input.length + fullResponse.length) / 4)
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
                output: fullResponse,
                tokensUsed,
                modelId: model.id,
              },
            }),
          ])
          
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
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
