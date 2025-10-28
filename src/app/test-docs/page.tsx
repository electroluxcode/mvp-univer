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

        univer.createUnit(UniverInstanceType.UNIVER_DOC, {
            id: 'doc1',
            body: {
                dataStream: 'test\r\n',
                textRuns: [],
                paragraphs: [{ startIndex: 0 }],
                sectionBreaks: [{ startIndex: 2 }],
            },
            documentStyle: {
                pageSize: { width: 595, height: 842 },
                marginTop: 72,
                marginBottom: 72,
                marginRight: 90,
                marginLeft: 90,
            },
        })
        const univerInstanceService = univer.__getInjector().get(IUniverInstanceService)
        setTimeout(() => {
            univerInstanceService.disposeUnit('doc1')
            univer.createUnit(UniverInstanceType.UNIVER_DOC, {
                id: 'doc2',
                body: {
                    dataStream: 'test2\r\n',
                    textRuns: [],
                    paragraphs: [{ startIndex: 0 }],
                    sectionBreaks: [{ startIndex: 2 }],
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