'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import UniverComponent from '@/components/UniverComponent'
import type { IWorkbookData } from '@univerjs/core'
import './style.css'
import Layout from '../layout'

// 默认示例数据
const DEFAULT_DATA: Partial<IWorkbookData> = {
  "id": "workbook-01",
  "sheetOrder": [
    "sheet-01",
    "nEMAIabptfMALhBKGrkkV"
  ],
  "name": "My Workbook",
  "appVersion": "0.10.12",
  "styles": {},
  "sheets": {
    "sheet-01": {
      "id": "sheet-01",
      "name": "Sheet1",
      "cellData": {
        "0": {
          "0": {
            "v": "Name adsa2323",
            "t": 1
          },
          "1": {
            "v": "Age"
          },
          "2": {
            "v": "City"
          }
        },
        "1": {
          "0": {
            "v": "Alice"
          },
          "1": {
            "v": 25
          },
          "2": {
            "v": "Beijing"
          }
        },
        "2": {
          "0": {
            "v": "Bob"
          },
          "1": {
            "v": 30
          },
          "2": {
            "v": "Shanghai"
          }
        }
      },
      "tabColor": "",
      "hidden": 0,
      "rowCount": 1000,
      "columnCount": 20,
      "zoomRatio": 1,
      "freeze": {
        "xSplit": 0,
        "ySplit": 0,
        "startRow": -1,
        "startColumn": -1
      },
      "scrollTop": 0,
      "scrollLeft": 0,
      "defaultColumnWidth": 88,
      "defaultRowHeight": 24,
      "mergeData": [],
      "rowData": {},
      "columnData": {
        "0": {
          "w": 260.60546875
        }
      },
      "showGridlines": 1,
      "rowHeader": {
        "width": 46,
        "hidden": 0
      },
      "columnHeader": {
        "height": 20,
        "hidden": 0
      },
      "rightToLeft": 0
    },
    "nEMAIabptfMALhBKGrkkV": {
      "id": "nEMAIabptfMALhBKGrkkV",
      "name": "Sheet1 （副本）",
      "cellData": {
        "0": {
          "0": {
            "v": "Name adsa2323232323",
            "t": 1
          },
          "1": {
            "v": "Age"
          },
          "2": {
            "v": "City"
          }
        },
        "1": {
          "0": {
            "v": "Alice"
          },
          "1": {
            "v": 25
          },
          "2": {
            "v": "Beijing"
          }
        },
        "2": {
          "0": {
            "v": "Bob"
          },
          "1": {
            "v": 30
          },
          "2": {
            "v": "Shanghai"
          }
        }
      },
      "tabColor": "",
      "hidden": 0,
      "rowCount": 1000,
      "columnCount": 20,
      "zoomRatio": 1,
      "freeze": {
        "xSplit": 0,
        "ySplit": 0,
        "startRow": -1,
        "startColumn": -1
      },
      "scrollTop": 0,
      "scrollLeft": 0,
      "defaultColumnWidth": 88,
      "defaultRowHeight": 24,
      "mergeData": [],
      "rowData": {},
      "columnData": {
        "0": {
          "w": 260.60546875
        }
      },
      "showGridlines": 1,
      "rowHeader": {
        "width": 46,
        "hidden": 0
      },
      "columnHeader": {
        "height": 20,
        "hidden": 0
      },
      "rightToLeft": 0
    }
  },
  "resources": []
}

export default function ExcelPlayground() {
  const [jsonData, setJsonData] = useState<string>(JSON.stringify(DEFAULT_DATA, null, 2))
  const [previewData, setPreviewData] = useState<Partial<IWorkbookData> | File>(DEFAULT_DATA)
  const [error, setError] = useState<string>('')
  const isUpdatingFromPreview = useRef(false)
  const isFromFileImport = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // JSON 编辑器变化 - 实时应用到预览（防抖）
  const handleJsonChange = useCallback((value: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    console.log('handleJsonChange123', value)
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
  const handleDataChange = useCallback((data: Partial<IWorkbookData>) => {
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

  // 导入 Excel 文件
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

  return (
    <div className="playground-container">
        {/* 顶部工具栏 */}
        <div className="playground-header">
          <h1>📊 Excel Playground</h1>
          <div className="header-actions">
            <button onClick={handleImportClick} className="import-btn">
              📂 导入 Excel
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
