import fs from 'fs'
import path from 'path'
import { Download, FileJson, CalendarDays, HardDrive } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface ReportFile {
  name: string
  size: number
  mtime: string
  periodLabel: string
  sizeLabel: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function parsePeriod(name: string): string | null {
  // 周报_20260727-20260801.json → 2026-07-27 ~ 2026-08-01
  const m = name.match(/周报_(\d{4})(\d{2})(\d{2})-(\d{4})(\d{2})(\d{2})\.json/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]} ~ ${m[4]}-${m[5]}-${m[6]}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ReportsPage() {
  const reportsDir = path.join(process.cwd(), 'public', 'reports')
  let files: ReportFile[] = []

  try {
    files = fs
      .readdirSync(reportsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const st = fs.statSync(path.join(reportsDir, f))
        return {
          name: f,
          size: st.size,
          mtime: st.mtime.toISOString(),
          periodLabel: parsePeriod(f) || f.replace(/\.json$/, ''),
          sizeLabel: formatSize(st.size),
        }
      })
      .sort((a, b) => b.mtime.localeCompare(a.mtime))
  } catch {
    files = []
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <FileJson className="w-4 h-4" />
            文件下载中心
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">周报文件下载</h1>
          <p className="text-slate-500">以下为公开发布的周报文档，点击「下载」即可保存到本地。</p>
        </div>

        {/* 列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {files.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileJson className="w-10 h-10 mx-auto mb-3 opacity-40" />
              暂无可用文件
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {files.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileJson className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 truncate">{f.name}</span>
                      <span className="shrink-0 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5">
                        {f.sizeLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        周期：{f.periodLabel}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5" />
                        更新：{formatDate(f.mtime)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`/api/reports/download?name=${encodeURIComponent(f.name)}`}
                    className="shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          文件为 JSON 格式，可直接查看或导入分析工具
        </p>
      </div>
    </main>
  )
}
