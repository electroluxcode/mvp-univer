import { useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from "react"
import { useUnmount, useSafeState, useMount } from "ahooks"

import { UniverRenderer, type UniverRendererConfig } from "./UniverRenderer"
import type { UniverComponentNewProps } from "./types"
import type { IWorkbookData } from "@univerjs/core"

import "./styles.css"

export interface UniverComponentRef {
	getWorksheetData: () => Partial<IWorkbookData> | null
	exportToExcel: (fileName?: string) => Promise<void>
}

/**  Univer 表格组件 */
const UniverComponentNew = forwardRef<UniverComponentRef, UniverComponentNewProps>((props, ref) => {
	const { data, width = "100%", height = "100%", mode = "readonly", onDataChange } = props

	const [loading, setLoading] = useSafeState(true)
	const [error, setError] = useSafeState<string | null>(null)

	const containerRef = useRef<HTMLDivElement>(null)
	const rendererRef = useRef<UniverRenderer | null>(null)
	const isInitializedRef = useRef(false)
	const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// 暴露给父组件的方法
	useImperativeHandle(ref, () => ({
		getWorksheetData: () => {
			return rendererRef.current?.getWorksheetData() || null
		},
		exportToExcel: async (fileName?: string) => {
			if (rendererRef.current) {
				await rendererRef.current.exportToExcel(fileName)
			}
		}
	}))
	useEffect(() => {
		if (!isInitializedRef.current || !rendererRef.current) {
			return
		}
		
		// 区分文件导入和数据更新
		if (data instanceof File) {
			// 文件导入：全量替换
			rendererRef.current.loadFile(data).catch((error) => {
				console.error('导入文件失败:', error)
				setError(error instanceof Error ? error.message : '导入失败')
			})
		} else {
			// JSON 数据更新：增量更新
			rendererRef.current.updateWorksheetData(data).catch((error) => {
				console.error('更新数据失败:', error)
			})
		}
	}, [data, setError])
	/** 清理渲染器实例 */
	const disposeRenderer = useCallback(() => {
		if (rendererRef.current && !rendererRef.current.isDisposed()) {
			rendererRef.current.dispose()
			rendererRef.current = null
		}
	}, [])

	/** 初始化渲染器 */
	const initializeRenderer = useCallback(async () => {
		if (!containerRef.current) return
		if (isInitializedRef.current && !error) return

		isInitializedRef.current = true

		try {
			setLoading(true)
			setError(null)
			disposeRenderer()

			const config: UniverRendererConfig = {
				container: containerRef.current,
				mode,
				data,
				onDataChange,
			}

			const renderer = new UniverRenderer(config, {
				onInitialized: () => {
					setLoading(false)
				},
				onError: (errorMessage) => {
					setError(errorMessage)
					setLoading(false)
					isInitializedRef.current = false
				},
			})

			rendererRef.current = renderer
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "初始化失败"
			setError(errorMessage)
			setLoading(false)
			isInitializedRef.current = false
		}
	}, [error, setLoading, setError, disposeRenderer, mode, data])

	useMount(() => {
		if (cleanupTimeoutRef.current) {
			clearTimeout(cleanupTimeoutRef.current)
			cleanupTimeoutRef.current = null
		}
		initializeRenderer()
	})

	useUnmount(() => {
		const cleanup = () => {
			disposeRenderer()
			isInitializedRef.current = false
			cleanupTimeoutRef.current = null
		}

		if (process.env.NODE_ENV === "development") {
			cleanupTimeoutRef.current = setTimeout(cleanup, 200)
		} else {
			cleanup()
		}
	})

	if (error) {
		return (
			<div className="univer-new-error-container" style={{ width, height }}>
				<div className="univer-new-error">
					<h3>加载失败</h3>
					<p>{error}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="univer-new-wrapper" style={{ width, height }}>
			
			<div
				ref={containerRef}
				className="univer-new-container"
				style={{
					width: "100%",
					height: "100%",
					opacity: loading ? 0 : 1,
					visibility: loading ? "hidden" : "visible",
					transition: loading ? "none" : "opacity 0.1s ease",
				}}
			/>
		</div>
	)
})


export default UniverComponentNew
