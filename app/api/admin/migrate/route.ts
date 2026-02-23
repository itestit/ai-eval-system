import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

// 执行数据库迁移的核心逻辑
async function runMigration() {
  const prisma = new PrismaClient()
  
  try {
    // 检查 Section 表是否存在
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Section" LIMIT 1`
      return { success: true, message: 'Section 表已存在' }
    } catch {
      // 表不存在，创建表
    }
    
    // 创建 Section 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Section" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "visibility" TEXT DEFAULT 'ALL',
        "sortOrder" INTEGER DEFAULT 0,
        "promptTemplateId" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // 创建 SectionAccess 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SectionAccess" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "sectionId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("sectionId", "userId")
      )
    `
    
    // 添加外键
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Section" ADD CONSTRAINT "Section_promptTemplateId_fkey" 
        FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL
      `
    } catch {}
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "SectionAccess" ADD CONSTRAINT "SectionAccess_sectionId_fkey" 
        FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE
      `
    } catch {}
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "SectionAccess" ADD CONSTRAINT "SectionAccess_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      `
    } catch {}
    
    // 添加 EvalLog.sectionId 列
    try {
      await prisma.$executeRaw`ALTER TABLE "EvalLog" ADD COLUMN "sectionId" TEXT`
    } catch {}
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE "EvalLog" ADD CONSTRAINT "EvalLog_sectionId_fkey" 
        FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL
      `
    } catch {}
    
    return { success: true, message: '数据库迁移完成' }
  } catch (error) {
    console.error('Migration error:', error)
    return { success: false, error: '迁移失败', details: String(error) }
  } finally {
    await prisma.$disconnect()
  }
}

// GET 请求 - 用于执行迁移（需要管理员登录）
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const result = await runMigration()
    return Response.json(result)
  } catch (error) {
    console.error('Migration error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '迁移失败', details: String(error) }, { status: 500 })
  }
}

// POST 请求 - 用于执行迁移（需要管理员登录）
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const result = await runMigration()
    return Response.json(result)
  } catch (error) {
    console.error('Migration error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: '未登录' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return Response.json({ error: '无权限' }, { status: 403 })
    }
    return Response.json({ error: '迁移失败', details: String(error) }, { status: 500 })
  }
}