'use client'

import './style.css'
import { IUniverInstanceService, LocaleType, mergeLocales, Univer, UniverInstanceType } from '@univerjs/core'
import DesignZhCN from '@univerjs/design/locale/zh-CN'
import { UniverDocsPlugin } from '@univerjs/docs'
import { UniverDocsUIPlugin } from '@univerjs/docs-ui'
import DocsUIZhCN from '@univerjs/docs-ui/locale/zh-CN'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverUIPlugin } from '@univerjs/ui'
import UIZhCN from '@univerjs/ui/locale/zh-CN'
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';

import '@univerjs/engine-formula/facade'
import '@univerjs/ui/facade'
import '@univerjs/docs-ui/facade'

import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import { useEffect } from 'react'
import { UniverSheetsNumfmtUIPlugin } from '@univerjs/sheets-numfmt-ui'
import { UniverSheetsFormulaUIPlugin } from '@univerjs/sheets-formula-ui'
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui'
import { UniverSheetsPlugin } from '@univerjs/sheets'


export default function TestPage() {
    useEffect(() => {
        const univer = new Univer({
            locale: LocaleType.ZH_CN,
            locales: {
                [LocaleType.ZH_CN]: mergeLocales(DesignZhCN, UIZhCN, DocsUIZhCN),
            },
        }
        )
        univer.registerPlugin(UniverRenderEnginePlugin)
        univer.registerPlugin(UniverFormulaEnginePlugin)

        univer.registerPlugin(UniverUIPlugin, {
            container: 'app',
        })

        univer.registerPlugin(UniverDocsPlugin)
        univer.registerPlugin(UniverDocsUIPlugin)

        univer.registerPlugin(UniverSheetsPlugin)
        univer.registerPlugin(UniverSheetsUIPlugin)
        univer.registerPlugin(UniverSheetsFormulaUIPlugin)
        univer.registerPlugin(UniverSheetsNumfmtUIPlugin)

        univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
            id: 'sheet1',
            body: {
                id: 'sheet1',
                name: 'Sheet1',
                cellData: {
                    'A1': { v: 'Hello, World!' },
                },
            },
        })
        const univerInstanceService = univer.__getInjector().get(IUniverInstanceService)
        setTimeout(() => {
            univerInstanceService.disposeUnit('sheet1')
            univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
                id: 'sheet2',
                body: {
                    id: 'sheet2',
                    name: 'Sheet2',
                    cellData: {
                        'A1': { v: 'Hello, World!' },
                    },
                },
            })
        }, 1000)
    }, [])
    return (
        <div id="app">
            <div id="app-container"></div>
        </div>
    )
}