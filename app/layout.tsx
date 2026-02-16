import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { prisma } from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'] })

async function getSiteTitle(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'siteTitle' },
    })
    return config?.value || 'AI智能评测系统'
  } catch {
    return 'AI智能评测系统'
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteTitle()
  return {
    title,
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
