import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

// 执行数据库迁移
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    
    const prisma = new PrismaClient()
    
    // 检查 Section 表是否存在
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Section" LIMIT 1`
      return Response.json({ message: 'Section 表已存在' })
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
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Section_promptTemplateId_fkey') THEN
          ALTER TABLE "Section" ADD CONSTRAINT "Section_promptTemplateId_fkey" 
          FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SectionAccess_sectionId_fkey') THEN
          ALTER TABLE "SectionAccess" ADD CONSTRAINT "SectionAccess_sectionId_fkey" 
          FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SectionAccess_userId_fkey') THEN
          ALTER TABLE "SectionAccess" ADD CONSTRAINT "SectionAccess_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `
    
    // 添加 EvalLog.sectionId 列
    try {
      await prisma.$executeRaw`ALTER TABLE "EvalLog" ADD COLUMN "sectionId" TEXT`
    } catch {
      // 列已存在
    }
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EvalLog_sectionId_fkey') THEN
          ALTER TABLE "EvalLog" ADD CONSTRAINT "EvalLog_sectionId_fkey" 
          FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `
    
    await prisma.$disconnect()
    
    return Response.json({ success: true, message: '数据库迁移完成' })
  } catch (error) {
    console.error('Migration error:', error)
    return Response.json({ error: '迁移失败', details: String(error) }, { status: 500 })
  }
}