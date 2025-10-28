'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import UniverComponent from '@/components/UniverComponent'
import type { UniverComponentRef } from '@/components/UniverComponent'
import type { IWorkbookData } from '@univerjs/core'
import './style.css'
import { DEFAULT_DATA } from './data'


export default function ExcelPlayground() {
  const [jsonData, setJsonData] = useState<string>(JSON.stringify(DEFAULT_DATA, null, 2))
  const [previewData, setPreviewData] = useState<Partial<IWorkbookData> | File>(DEFAULT_DATA)
  const [error, setError] = useState<string>('')
  const [isFromJsonEditor, setIsFromJsonEditor] = useState<boolean>(false)
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
    console.log('handleJsonChange123', value)
    debounceTimer.current = setTimeout(() => {
      try {
        const parsed = JSON.parse(value)
        setIsFromJsonEditor(true) // 标记为从 JSON 编辑器更新
        setPreviewData(parsed)
        setError('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid JSON')
      }
    }, 500)
  }, [])


  // 预览数据变化 - 实时同步到 JSON
  const handleDataChange = useCallback((data: Partial<IWorkbookData>) => {
    isUpdatingFromPreview.current = true
    const newJson = JSON.stringify(data, null, 2)
    setJsonData(newJson)

    // 如果是从文件导入，也需要更新 previewData 为 JSON 格式
    if (isFromFileImport.current) {
      setPreviewData(data)
      isFromFileImport.current = false
    }

    // 重置 JSON 编辑器标志
    setIsFromJsonEditor(false)
    isUpdatingFromPreview.current = false
  }, [])

  const onJsonInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setJsonData(value)
    if (!isUpdatingFromPreview.current) {
      handleJsonChange(value)
    }
  }

  // 导入 Excel 文件
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 标记为文件导入
      isFromFileImport.current = true
      setIsFromJsonEditor(false) // 文件导入不需要全量更新标志
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

  // 导出 Excel 文件
  const handleExportClick = useCallback(() => {
    try {
      if (!univerRef.current) {
        setError('组件未初始化')
        return
      }
      univerRef.current.exportToExcel()
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
          <h1>📊 Excel Playground</h1>
          <div className="header-actions">
            <button onClick={handleImportClick} className="import-btn">
              📂 导入 Excel
            </button>
            <button onClick={handleExportClick} className="import-btn" style={{ marginLeft: '10px' }}>
              💾 导出 Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
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
                data={previewData}
                width="100%"
                height="100%"
                mode="edit"
                onDataChange={handleDataChange}
                fullUpdate={isFromJsonEditor}
              />
            </div>
          </div>
        </div>
      </div>
  )
}
