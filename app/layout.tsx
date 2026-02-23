import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { prisma } from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'] })

// 动态生成 metadata，从数据库读取配置
export async function generateMetadata(): Promise<Metadata> {
  // 从数据库获取配置
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: ['siteTitle', 'pageHeader'],
      },
    },
  })

  const configMap: Record<string, string> = {
    siteTitle: 'AI智能评测系统',
    pageHeader: 'AI智能评测',
  }

  configs.forEach((config) => {
    configMap[config.key] = config.value
  })

  return {
    title: configMap.siteTitle,
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
