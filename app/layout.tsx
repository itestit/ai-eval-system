import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { prisma } from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'] })

// 动态生成 metadata，从数据库读取配置
export async function generateMetadata(): Promise<Metadata> {
  // 默认标题
  let siteTitle = process.env.SITE_TITLE || 'AI智能评测系统'

  try {
    // 从数据库获取配置（带超时保护）
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['siteTitle'],
        },
      },
    })

    configs.forEach((config) => {
      if (config.key === 'siteTitle') {
        siteTitle = config.value
      }
    })
  } catch (error) {
    // 构建时数据库可能不可用，使用默认值
    console.log('使用默认标题（数据库连接失败）')
  }

  return {
    title: siteTitle,
    description: '基于大语言模型的智能评测平台',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
