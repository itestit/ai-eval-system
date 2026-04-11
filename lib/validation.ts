import { NextRequest } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

/**
 * 解析并校验请求体。
 *
 * 使用示例：
 *   const parsed = await parseBody(req, Schema)
 *   if (!parsed.ok) return parsed.response
 *   const data = parsed.data
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<
  | { ok: true; data: T }
  | { ok: false; response: Response }
> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return {
      ok: false,
      response: Response.json(
        { error: '请求体格式错误（不是合法 JSON）' },
        { status: 400 }
      ),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      ok: false,
      response: Response.json(
        {
          error: '输入校验失败',
          details: formatZodError(result.error),
        },
        { status: 400 }
      ),
    }
  }

  return { ok: true, data: result.data }
}

function formatZodError(err: ZodError): Array<{ path: string; message: string }> {
  return err.errors.map((e) => ({
    path: e.path.join('.') || '(root)',
    message: e.message,
  }))
}
