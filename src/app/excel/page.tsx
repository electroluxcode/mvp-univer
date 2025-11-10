'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import UniverComponent from '@/components/UniverComponent'
import type { UniverComponentRef } from '@/components/UniverComponent'
import type { IWorkbookData } from '@univerjs/core'
import './style.css'
import { DEFAULT_DATA } from './data'
import { SupportedFileOutputModeMap } from '../../components/UniverComponent/types'
import { useSafeState } from 'ahooks'


const nowImportType = SupportedFileOutputModeMap.buffer

export default function ExcelPlayground() {
  const [jsonData, setJsonData] = useState<string>(JSON.stringify(DEFAULT_DATA, null, 2))
  const [previewData, setPreviewData] = useState<Partial<IWorkbookData> | File>(DEFAULT_DATA)
  const [error, setError] = useState<string>('')
  const [isFromJsonEditor, setIsFromJsonEditor] = useState<boolean>(false)
  const [isReadonly, setIsReadonly] = useState<boolean>(false)
  const isUpdatingFromPreview = useRef(false)
  const isFromFileImport = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const univerRef = useRef<UniverComponentRef>(null)

  const [isLoading, setIsLoading] = useSafeState(true)
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

  useEffect(() => {
    if(nowImportType !== SupportedFileOutputModeMap.buffer){
      setPreviewData(DEFAULT_DATA)
      setIsLoading(false)
    }else{
      // 导入 /test.xlsx 文件内容
      fetch('/test.xlsx').then(res => res.arrayBuffer()).then(data => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        setPreviewData(new File([blob], 'test.xlsx'))
        setIsLoading(false)
      })
    }
  }, [nowImportType])



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
  const handleExportClick = useCallback(async () => {
    try {
      if (!univerRef.current) {
        setError('组件未初始化')
        return
      }
      univerRef.current.exportToExcel({
        mode: nowImportType,
        isDownload: true,
        fileName: `export_${new Date().getTime()}.xlsx`,
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
          <h1>📊 Excel Playground</h1>
          <div className="header-actions">
            <button onClick={handleImportClick} className="import-btn">
              📂 导入 Excel
            </button>
            <button onClick={handleExportClick} className="import-btn" style={{ marginLeft: '10px' }}>
              💾 导出 Excel
            </button>
            <button onClick={handleToggleReadonly} className="import-btn" style={{ marginLeft: '10px' }}>
              {isReadonly ? '只读模式' : '编辑模式'}
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
