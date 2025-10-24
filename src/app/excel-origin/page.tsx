'use client'
import { useEffect, useRef } from 'react'
import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula-ui/lib/index.css'
import '@univerjs/sheets-numfmt-ui/lib/index.css'
import './style.css'
import {Univer, UniverInstanceType, LocaleType, mergeLocales} from '@univerjs/core'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverUIPlugin } from '@univerjs/ui'
import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'  
import XLSX from "xlsx-js-style"
import { WORKBOOK_DATA } from './data'
import DesignZhCN from '@univerjs/design/locale/zh-CN'
import UIZhCN from '@univerjs/ui/locale/zh-CN'
import DocsUIZhCN from '@univerjs/docs-ui/locale/zh-CN'
import SheetsZhCN from '@univerjs/sheets/locale/zh-CN'
import SheetsUIZhCN from '@univerjs/sheets-ui/locale/zh-CN'
import SheetsFormulaUIZhCN from '@univerjs/sheets-formula-ui/locale/zh-CN'
import SheetsNumfmtUIZhCN from '@univerjs/sheets-numfmt-ui/locale/zh-CN'
import { UniverSheetsNumfmtUIPlugin } from '@univerjs/sheets-numfmt-ui'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'
export default function ExcelTestPage() {
    const univerRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const initUniver = () => {
        const univerData = WORKBOOK_DATA
        if (univerRef.current) univerRef.current.dispose()

        const univer = new Univer({
            locale: LocaleType.ZH_CN,
            locales: {
                [LocaleType.ZH_CN]: mergeLocales(
                    DesignZhCN,
                    UIZhCN,
                    DocsUIZhCN,
                    SheetsZhCN,
                    SheetsUIZhCN,
                    SheetsFormulaUIZhCN,
                    SheetsNumfmtUIZhCN,
                ),
            },
        })
        univer.registerPlugin(UniverRenderEnginePlugin)
        univer.registerPlugin(UniverFormulaEnginePlugin)
        univer.registerPlugin(UniverUIPlugin, { container: containerRef.current })
        univer.registerPlugin(UniverDocsPlugin)
        univer.registerPlugin(UniverDocsUIPlugin)
        univer.registerPlugin(UniverSheetsPlugin)
        univer.registerPlugin(UniverSheetsUIPlugin)
        univer.registerPlugin(UniverSheetsFormulaUIPlugin)
        univer.registerPlugin(UniverSheetsNumfmtUIPlugin)
        univer.createUnit(UniverInstanceType.UNIVER_SHEET, univerData)
    }   
    useEffect(() => {
        initUniver()
    }, [])
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
           
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data, { type: 'array', cellStyles: true })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]

            const cellData: any = {}
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
            
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
                    const cell = worksheet[cellAddress]
                    if (cell && cell.v !== undefined) {
                        if (!cellData[R]) cellData[R] = {}
                        cellData[R][C] = { v: cell.v }
                    }
                }
            }

            const univerData = {
                id: 'workbook-01',
                name: file.name,
                sheetOrder: ['sheet-01'],
                sheets: {
                    'sheet-01': {
                        id: 'sheet-01',
                        name: sheetName,
                        cellData,
                    }
                }
            }

            if (univerRef.current) univerRef.current.dispose()

            const univer = new Univer({
                locale: LocaleType.ZH_CN,
                locales: {
                    [LocaleType.ZH_CN]: mergeLocales(
                        DesignZhCN,
                        UIZhCN,
                        DocsUIZhCN,
                        SheetsZhCN,
                        SheetsUIZhCN,
                        SheetsFormulaUIZhCN,
                        SheetsNumfmtUIZhCN,
                    ),
                },
            })
            univer.registerPlugin(UniverRenderEnginePlugin)
            univer.registerPlugin(UniverFormulaEnginePlugin)
            univer.registerPlugin(UniverUIPlugin, { container: containerRef.current })
            univer.registerPlugin(UniverDocsPlugin)
            univer.registerPlugin(UniverDocsUIPlugin)
            univer.registerPlugin(UniverSheetsPlugin)
            univer.registerPlugin(UniverSheetsUIPlugin)
            univer.registerPlugin(UniverSheetsFormulaUIPlugin)
            univer.registerPlugin(UniverSheetsNumfmtUIPlugin)
            univer.createUnit(UniverInstanceType.UNIVER_SHEET, univerData)

            univerRef.current = univer
        } catch (error) {
            console.error('导入失败:', error)
            alert('文件导入失败: ' + (error instanceof Error ? error.message : '未知错误'))
        }
    }

    return (
        <div className="page">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
            <div ref={containerRef} id="app" className="container" />
        </div>
    )
}