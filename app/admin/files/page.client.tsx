'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Trash2, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KnowledgeFile {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
}

interface FilePageProps {
  files: KnowledgeFile[]
}

export default function FilePageClient({ files }: FilePageProps) {
  const [fileList, setFileList] = useState(files)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles?.[0]) {
      await uploadFile(droppedFiles[0])
    }
  }, [])

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      alert('仅支持 .txt 和 .pdf 文件')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/files', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setFileList([data.file, ...fileList])
      } else {
        const error = await res.json()
        alert(error.error || '上传失败')
      }
    } catch (err) {
      alert('上传过程中出错')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteFile = async (id: string) => {
    if (!confirm('确定要删除这个文件吗？引用此文件的Prompt模板将失效。')) return

    const res = await fetch(`/api/admin/files?id=${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setFileList(fileList.filter(f => f.id !== id))
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">知识库文件管理</h1>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 mb-8 text-center transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        
        <label 
          htmlFor="file-upload"
          className="cursor-pointer block"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            
            <p className="font-medium">
              {isUploading ? '上传中...' : '点击或拖拽文件到此处上传'}
            </p>
            
            <p className="text-sm text-muted-foreground">
              支持 .txt 和 .pdf 格式，最大 10MB
            </p>
          </div>
        </label>
      </div>

      {/* File List */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">文件名</th>
              <th className="px-6 py-3 text-left text-sm font-medium">类型</th>
              <th className="px-6 py-3 text-left text-sm font-medium">大小</th>
              <th className="px-6 py-3 text-left text-sm font-medium">上传时间</th>
              <th className="px-6 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fileList.map((file) => (
              <tr key={file.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs bg-muted"
                >
                    {file.type === 'application/pdf' ? 'PDF' : 'Text'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {formatSize(file.size)}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {new Date(file.createdAt).toLocaleString('zh-CN')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {fileList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  暂无文件，请上传知识库文件
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>提示：</strong> 
          上传的文件可在 Prompt 模板中通过输入 @ 符号引用，系统会将文件内容自动注入到提示词中。
        </p>
      </div>
    </div>
  )
}
