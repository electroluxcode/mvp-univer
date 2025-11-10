'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import UniverComponent from '@/components/UniverComponent'
import type { UniverComponentRef } from '@/components/UniverComponent'
import type { IDocumentData } from '@univerjs/core'
import '../excel/style.css'
import { DEFAULT_DOC_DATA } from './data'
import { SupportedFileOutputModeMap } from '../../components/UniverComponent/types'


const nowImportType = SupportedFileOutputModeMap.buffer

export default function DocsPage() {
  const [previewData, setPreviewData] = useState<Partial<IDocumentData> | File>(DEFAULT_DOC_DATA)
  const [error, setError] = useState<string>('')
  const [isFromJsonEditor, setIsFromJsonEditor] = useState<boolean>(false)
  const [isReadonly, setIsReadonly] = useState<boolean>(false)
  const isFromFileImport = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const univerRef = useRef<UniverComponentRef>(null)

  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    if(nowImportType !== SupportedFileOutputModeMap.buffer){
      setPreviewData(DEFAULT_DOC_DATA)
      setIsLoading(false)
    }else{
      fetch('/test.docx').then(res => res.arrayBuffer()).then(data => {
        const blob = new Blob([data], )
        setPreviewData(new File([blob], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=UTF-8' }))
        setIsLoading(false)
      })
    }
  }, [])
  // 导入文档文件
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 标记为文件导入
      isFromFileImport.current = true
      setIsFromJsonEditor(false) // 文件导入不需要全量更新标志
      // 设置文件数据，触发全量替换
      setPreviewData(file)
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
      await univerRef.current.exportToDocx({
        mode: nowImportType,
        isDownload: true,
        fileName: `export_${new Date().getTime()}.docx`,
      })
      
      setError('')
    } catch (err) {
      console.error('导出失败:', err)
      setError(err instanceof Error ? err.message : '导出失败')
    }
  }, [])

  // 切换只读模式
  const handleToggleReadonly = useCallback(() => {
    const newMode = !isReadonly
    setIsReadonly(newMode)
    univerRef.current?.setMode(newMode ? 'readonly' : 'edit')
  }, [isReadonly])

  if(isLoading){
    return <div>Loading...</div>
  }
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
          <button onClick={handleToggleReadonly} className="import-btn" style={{ marginLeft: '10px' }}>
            {isReadonly ? '只读模式' : '编辑模式'}
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
              mode={isReadonly ? 'readonly' : 'edit'}
              // onDataChange={handleDataChange}
              fullUpdate={isFromJsonEditor}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
