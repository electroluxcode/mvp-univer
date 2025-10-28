'use client'

import { useState, useRef, useCallback } from 'react'
import UniverComponent from '@/components/UniverComponent'
import type { UniverComponentRef } from '@/components/UniverComponent'
import type { IDocumentData } from '@univerjs/core'
import '../excel/style.css'
import { DEFAULT_DOC_DATA } from './data'

export default function DocsPage() {
  const [jsonData, setJsonData] = useState<string>(JSON.stringify(DEFAULT_DOC_DATA, null, 2))
  const [previewData, setPreviewData] = useState<Partial<IDocumentData> | File>(DEFAULT_DOC_DATA)
  const [error, setError] = useState<string>('')
  const isUpdatingFromPreview = useRef(false)
  const isFromFileImport = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const univerRef = useRef<UniverComponentRef>(null)

  // JSON 编辑器变化 - 实时应用到预览（防抖）
  const handleJsonChange = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    debounceTimer.current = setTimeout(() => {
      try {
        const parsed = JSON.parse(value)
        setPreviewData(parsed)
        setError('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid JSON')
      }
    }, 500)
  }, [])

  // 预览数据变化 - 实时同步到 JSON
  const handleDataChange = useCallback((data: Partial<IDocumentData>) => {
    isUpdatingFromPreview.current = true
    const newJson = JSON.stringify(data, null, 2)
    setJsonData(newJson)

    // 如果是从文件导入，也需要更新 previewData 为 JSON 格式
    if (isFromFileImport.current) {
      setPreviewData(data)
      isFromFileImport.current = false
    }

    isUpdatingFromPreview.current = false
  }, [])

  const onJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setJsonData(value)
    if (!isUpdatingFromPreview.current) {
      handleJsonChange(value)
    }
  }

  // 导入文档文件
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 标记为文件导入
      isFromFileImport.current = true
      // 设置文件数据，触发全量替换
      setPreviewData(file)
      setJsonData(`// 正在导入文件: ${file.name}\n// 等待转换完成...`)
      setError('')
      // 清空 input 值，允许重复导入同一文件
      e.target.value = ''
    }
  }, [])

  // 触发文件选择
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 导出文档文件为 docx
  const handleExportClick = useCallback(async () => {
    try {
      if (!univerRef.current) {
        setError('组件未初始化')
        return
      }
      
      // 使用新的 exportToDocx 方法导出为 .docx 文件
      await univerRef.current.exportToDocx()
      
      setError('')
    } catch (err) {
      console.error('导出失败:', err)
      setError(err instanceof Error ? err.message : '导出失败')
    }
  }, [])

  return (
    <div className="playground-container">
      {/* 顶部工具栏 */}
      <div className="playground-header">
        <h1>📝 Docs Playground</h1>
        <div className="header-actions">
          <button onClick={handleImportClick} className="import-btn">
            📂 导入文档
          </button>
          <button onClick={handleExportClick} className="import-btn" style={{ marginLeft: '10px' }}>
            💾 导出文档
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <div className="status">
            {error ? (
              <span className="status-error">❌ {error}</span>
            ) : (
              <span className="status-ok">✓ 实时同步</span>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="playground-content">
        {/* 左侧 JSON 编辑器 */}
        <div className="editor-panel">
          <div className="panel-header">
            <h3>JSON 数据</h3>
          </div>
          <textarea
            className="json-editor"
            value={jsonData}
            onChange={onJsonInputChange}
            spellCheck={false}
          />
        </div>

        {/* 右侧预览 */}
        <div className="preview-panel">
          <div className="panel-header">
            <h3>实时预览</h3>
          </div>
          <div className="preview-container">
            <UniverComponent
              ref={univerRef}
              type="doc"
              data={previewData}
              width="100%"
              height="100%"
              mode="edit"
              onDataChange={handleDataChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
