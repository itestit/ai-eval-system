import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// 公开下载接口：从 public/reports 目录提供周报文件，强制浏览器以附件方式下载
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')

  if (!name) {
    return Response.json({ error: '缺少文件名' }, { status: 400 })
  }

  // 安全校验：只取文件名部分，杜绝路径穿越
  const safeName = name.split('/').pop() || name
  if (!safeName.endsWith('.json')) {
    return Response.json({ error: '仅支持 .json 文件' }, { status: 400 })
  }

  const filePath = join(process.cwd(), 'public', 'reports', safeName)

  try {
    const data = readFileSync(filePath)
    const encoded = encodeURIComponent(safeName)

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return Response.json({ error: '文件不存在' }, { status: 404 })
  }
}
