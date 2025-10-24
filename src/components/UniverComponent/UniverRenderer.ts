import {
	LocaleType,
	Univer,
	UniverInstanceType,
	IPermissionService,
	ICommandService,
	IUniverInstanceService,
	type Workbook,
	IWorkbookData,
	CommandType,
} from "@univerjs/core"
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula"
import { UniverRenderEnginePlugin } from "@univerjs/engine-render"
import {
	UniverSheetsPlugin,
	WorkbookEditablePermission,
	WorksheetSetCellValuePermission,
	WorksheetSetCellStylePermission,
	WorksheetEditPermission,
	WorksheetSetColumnStylePermission,
	SetRangeValuesMutation,
} from "@univerjs/sheets"
import { UniverDocsPlugin } from "@univerjs/docs"
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui"
import { UniverSheetsNumfmtUIPlugin } from "@univerjs/sheets-numfmt-ui"
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui"
import { UniverDocsUIPlugin } from "@univerjs/docs-ui"
import { UniverUIPlugin } from "@univerjs/ui"
import { merge } from "lodash-es"

import DesignZhCN from "@univerjs/design/locale/zh-CN"
import DocsUIZhCN from "@univerjs/docs-ui/locale/zh-CN"
import SheetsFormulaUIZhCN from "@univerjs/sheets-formula-ui/locale/zh-CN"
import SheetsNumfmtUIZhCN from "@univerjs/sheets-numfmt-ui/locale/zh-CN"
import SheetsUIZhCN from "@univerjs/sheets-ui/locale/zh-CN"
import SheetsZhCN from "@univerjs/sheets/locale/zh-CN"
import UIZhCN from "@univerjs/ui/locale/zh-CN"

import { UniverWorkerManager } from "./UniverWorkerManager"

import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula-ui/lib/index.css'
import '@univerjs/sheets-numfmt-ui/lib/index.css'

export interface UniverRendererConfig {
	container: HTMLElement
	mode: "readonly" | "edit"
	data: File | Partial<IWorkbookData>
	onDataChange?: (data: Partial<IWorkbookData>) => void
}

export interface UniverRendererCallbacks {
	onInitialized?: () => void
	onError?: (error: string) => void
}

/** Univer 表格渲染器 */
export class UniverRenderer {
	private univer: Univer | null = null
	private config: UniverRendererConfig
	private callbacks: UniverRendererCallbacks
	private disposed = false
	private fileName: string
	private isCsvFile: boolean
	private workerManager: UniverWorkerManager | null = null
	private workbookId: string | null = null

	constructor(config: UniverRendererConfig, callbacks: UniverRendererCallbacks = {}) {
		this.config = config
		this.callbacks = callbacks
		this.fileName = this.extractFileName()
		this.isCsvFile = this.fileName.toLowerCase().endsWith(".csv")

		// 初始化 Worker 管理器
		this.initializeWorkerManager()

		// 自动初始化和渲染
		this.autoInitializeAndRender()
	}

	/** 初始化 Univer 实例和插件 */
	async initialize(): Promise<void> {
		if (this.disposed) {
			throw new Error("Renderer has been disposed")
		}

		try {
			this.univer = new Univer({
				locale: LocaleType.ZH_CN,
				locales: {
					[LocaleType.ZH_CN]: merge(
						{},
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
			this.registerPlugins()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "初始化失败"
			this.callbacks.onError?.(errorMessage)
			throw error
		}
	}

	/** 渲染数据到工作簿 */
	private async render(): Promise<void> {
		if (!this.univer) {
			throw new Error("Renderer not initialized")
		}
		if (!this.workerManager) {
			throw new Error("Worker manager not initialized")
		}
		try {
			const data = this.getData()
			const isReadonly = this.config.mode === "readonly"
			const workbookData = await this.workerManager.transformData(
				data,
				this.fileName,
				isReadonly,
			)
			this.workbookId = workbookData.id as string
			this.univer.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData)
			this.configurePermissions()

			// 如果是只读模式，设置额外的编辑阻止逻辑
			if (isReadonly) {
				this.setupReadonlyBehavior()
			}

			// 完成初始化和数据转换后调用回调
			this.callbacks.onInitialized?.()
			
			// 设置编辑监听器
			this.setupOnDataChangeListener()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "渲染失败"
			this.callbacks.onError?.(errorMessage)
			throw error
		}
	}

	/** 设置编辑监听器 */
	private setupOnDataChangeListener(): void {
		if (!this.univer || !this.config.onDataChange) return

		let beforeData: string | null = null
		try {
			const commandService = this.univer.__getInjector().get(ICommandService)
			
			// 监听所有命令执行后的事件
			commandService.onCommandExecuted((command) => {
				if (command.type === CommandType.MUTATION) {
					const data = this.getWorksheetData()
						const isDataChanged =JSON.stringify(data) !==  beforeData
						if (data && isDataChanged) {
							beforeData = JSON.stringify(data)
							this.config.onDataChange?.(data)
						}
				}
			
			})
		} catch (error) {
			console.warn("[UniverRenderer] 设置编辑监听器失败:", error)
		}
	}

	/** 自动初始化和渲染 */
	private async autoInitializeAndRender(): Promise<void> {
		try {
			await this.initialize()
			await this.render()
		} catch (error) {
			// 错误已在各自方法中处理
		}
	}

	/** 销毁实例 */
	dispose(): void {
		if (this.univer && !this.disposed) {
			try {
				this.univer.dispose()
			} catch (error) {
				// ignore
			}
			this.univer = null
		}

		// 销毁 Worker 管理器
		if (this.workerManager) {
			try {
				this.workerManager.dispose()
			} catch (error) {
				// ignore
			}
			this.workerManager = null
		}

		this.disposed = true
	}

	/** 检查是否已销毁 */
	isDisposed(): boolean {
		return this.disposed
	}

	/** 注册所有必要的插件 */
	private registerPlugins(): void {
		if (!this.univer) return
		this.univer.registerPlugin(UniverRenderEnginePlugin)
		this.univer.registerPlugin(UniverFormulaEnginePlugin)
		this.univer.registerPlugin(UniverUIPlugin, {
			container: this.config.container,
			header: false,
			footer: !this.isCsvFile,
			contextMenu: false,
			disableAutoFocus: true,
		})
		this.univer.registerPlugin(UniverDocsPlugin)
		this.univer.registerPlugin(UniverDocsUIPlugin)
		this.univer.registerPlugin(UniverSheetsPlugin)
		const sheetsUIConfig = {
			footer: {
				sheetBar: true,
				statisticBar: false,
				menus: false,
				zoomSlider: false,
			},
			disableForceStringAlert: true,
			disableForceStringMark: true,
			formulaBar: false,
			clipboardConfig: {
				hidePasteOptions: true,
			},
			protectedRangeShadow: false,
			// 只读模式下禁用编辑相关功能
			...(this.config.mode === "readonly" && {
				cellEditor: {
					enabled: false,
				},
				selection: {
					enabled: true,
				},
			}),
		}
		this.univer.registerPlugin(UniverSheetsUIPlugin, sheetsUIConfig)
		this.univer.registerPlugin(UniverSheetsFormulaUIPlugin)
		this.univer.registerPlugin(UniverSheetsNumfmtUIPlugin)
	}

	/** 配置权限和显示设置 */
	private configurePermissions(): void {
		if (!this.univer) return
		setTimeout(() => {
			try {
				if (!this.univer) return
				const injector = this.univer.__getInjector()
				const permissionService = injector.get(IPermissionService)
				permissionService.setShowComponents(false)
				if (this.config.mode === "readonly") {
					this.setReadonlyMode(permissionService)
				}
			} catch (error) {
				console.warn("[UniverRenderer] 配置权限失败:", error)
			}
		}, 0)
	}

	/** 设置只读模式 */
	private setReadonlyMode(permissionService: IPermissionService): void {
		const unitId = this.workbookId || "workbook1"

		// 🎯 方案2：直接允许列相关权限，禁用其他编辑权限
		// console.log("[UniverRenderer] 设置只读模式，unitId:", unitId)

		// 获取当前活动工作表ID
		const worksheetId = this.getCurrentWorksheetId()
		// console.log("[UniverRenderer] 获取到工作表ID:", worksheetId)

		if (worksheetId) {
			// 🎯 精准权限控制：只允许列展开/隐藏，禁用其他编辑功能

			// ❌ 禁用单元格值编辑
			const cellValuePermission = new WorksheetSetCellValuePermission(unitId, worksheetId)
			if (!permissionService.getPermissionPoint(cellValuePermission.id)) {
				permissionService.addPermissionPoint(cellValuePermission)
			}
			permissionService.updatePermissionPoint(cellValuePermission.id, false)
			// console.log("[UniverRenderer] ❌ 已禁用单元格值编辑权限")

			// ❌ 禁用单元格样式编辑
			const cellStylePermission = new WorksheetSetCellStylePermission(unitId, worksheetId)
			if (!permissionService.getPermissionPoint(cellStylePermission.id)) {
				permissionService.addPermissionPoint(cellStylePermission)
			}
			permissionService.updatePermissionPoint(cellStylePermission.id, false)
			// console.log("[UniverRenderer] ❌ 已禁用单元格样式编辑权限")

			// ❌ 禁用工作表结构编辑（插入/删除行列等）
			// const worksheetEditPermission = new WorksheetEditPermission(unitId, worksheetId)
			// if (!permissionService.getPermissionPoint(worksheetEditPermission.id)) {
			// 	permissionService.addPermissionPoint(worksheetEditPermission)
			// }
			// permissionService.updatePermissionPoint(worksheetEditPermission.id, false)
			// console.log("[UniverRenderer] ❌ 已禁用工作表结构编辑权限")

			// ✅ 确保列展开/隐藏功能所需的权限是启用的

			// ✅ 启用工作簿编辑权限（SetSelectedColsVisibleCommand 需要）
			const workbookEditablePermission = new WorkbookEditablePermission(unitId)
			if (!permissionService.getPermissionPoint(workbookEditablePermission.id)) {
				permissionService.addPermissionPoint(workbookEditablePermission)
			}
			permissionService.updatePermissionPoint(workbookEditablePermission.id, true)
			// console.log("[UniverRenderer] ✅ 已启用工作簿编辑权限")

			// ✅ 启用列样式权限（SetSelectedColsVisibleCommand 需要）
			const columnStylePermission = new WorksheetSetColumnStylePermission(unitId, worksheetId)
			if (!permissionService.getPermissionPoint(columnStylePermission.id)) {
				permissionService.addPermissionPoint(columnStylePermission)
			}
			permissionService.updatePermissionPoint(columnStylePermission.id, true)
			// console.log("[UniverRenderer] ✅ 已启用列样式权限（包括列展开/隐藏）")
		} else {
			// console.warn("[UniverRenderer] 无法获取工作表ID，使用备用方案")
			// 备用方案：完全禁用编辑，但这会影响列展开功能
			const instance = new WorkbookEditablePermission(unitId)
			const editPermissionPoint = permissionService.getPermissionPoint(instance.id)
			if (!editPermissionPoint) {
				permissionService.addPermissionPoint(instance)
			}
			permissionService.updatePermissionPoint(instance.id, false)
		}
	}

	/** 获取当前工作表ID */
	private getCurrentWorksheetId(): string | null {
		try {
			if (!this.univer) return null

			const injector = this.univer.__getInjector()
			const univerInstanceService = injector.get(IUniverInstanceService)
			const workbook = univerInstanceService.getCurrentUnitForType<Workbook>(
				UniverInstanceType.UNIVER_SHEET,
			)
			if (!workbook) return null

			const activeSheet = workbook.getActiveSheet()
			return activeSheet ? activeSheet.getSheetId() : null
		} catch (error) {
			console.warn("[UniverRenderer] 获取工作表ID失败:", error)
			return null
		}
	}

	/** 设置只读行为 - 阻止所有编辑操作 */
	private setupReadonlyBehavior(): void {
		if (!this.univer) return

		setTimeout(() => {
			try {
				// 方法1: 通过 DOM 事件阻止双击编辑
				const container = this.config.container
				if (container) {
					// 阻止双击事件
					container.addEventListener(
						"dblclick",
						(e) => {
							e.preventDefault()
							e.stopPropagation()
							return false
						},
						true,
					) // 使用捕获阶段

					// 阻止键盘编辑（F2, Enter等）
					container.addEventListener(
						"keydown",
						(e) => {
							if (e.key === "F2" || e.key === "Enter") {
								e.preventDefault()
								e.stopPropagation()
								return false
							}
						},
						true,
					)
				}

				// 方法2: 通过命令服务阻止编辑命令
				if (!this.univer) return
				const injector = this.univer.__getInjector()
				const commandService = injector.get(ICommandService)

				// 拦截所有可能的编辑命令
				const editCommands = [
					"sheet.operation.set-cell-edit-visible",
					"sheet.command.start-edit",
					"sheet.command.edit-cell",
					"sheet.operation.start-edit",
					"doc.operation.insert-text",
					"doc.operation.delete-text",
					"doc.operation.replace-text",
				]

				editCommands.forEach((commandId) => {
					commandService.onCommandExecuted((command) => {
						if (command.id === commandId) {
							return false // 阻止命令执行
						}
					})
				})
			} catch (error) {
				console.warn("[UniverRenderer] 设置只读行为失败:", error)
			}
		}, 100)
	}

	/** 提取文件名 */
	private extractFileName(): string {
		if (this.config.data instanceof File) {
			return this.config.data.name || "未命名文件"
		}
		return this.config.data.name || "workbook.xlsx"
	}

	/** 获取数据 */
	private getData(): File | Partial<IWorkbookData> {
		return this.config.data
	}

	/** 获取当前 worksheet 数据 */
	public getWorksheetData(): Partial<IWorkbookData> | null {
		if (!this.univer || !this.workbookId) {
			return null
		}

		try {
			const univerInstanceService = this.univer.__getInjector().get(IUniverInstanceService)
			const workbook = univerInstanceService.getUnit<Workbook>(
				this.workbookId,
				UniverInstanceType.UNIVER_SHEET
			)
			
			if (!workbook) {
				return null
			}

			return workbook.save()
		} catch (error) {
			console.error("[UniverRenderer] 获取 worksheet 数据失败:", error)
			return null
		}
	}

	/** 初始化 Worker 管理器 */
	private initializeWorkerManager(): void {
		try {
			this.workerManager = new UniverWorkerManager()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Worker 初始化失败"
			this.callbacks.onError?.(errorMessage)
			throw error
		}
	}

	/** 更新 worksheet 数据（增量更新，保持光标等状态）-主动更新 */
	public async updateWorksheetData(newData: Partial<IWorkbookData>): Promise<void> {
		if (!this.univer || !this.workbookId) {
			console.error("[UniverRenderer] 无法获取 workbook 实例")
			return
		}

		try {
			const injector = this.univer.__getInjector()
			const commandService = injector.get(ICommandService)
			const univerInstanceService = injector.get(IUniverInstanceService)
			
			// 获取当前 workbook
			const workbook = univerInstanceService.getUnit<Workbook>(
				this.workbookId,
				UniverInstanceType.UNIVER_SHEET
			)
			
			if (!workbook) {
				console.error("[UniverRenderer] 无法获取 workbook 实例")
				return
			}

			// 如果新数据包含 sheets 数据，进行增量更新
			if (newData.sheets) {
				// 遍历所有 sheet 更新数据
				for (const [sheetId, sheetData] of Object.entries(newData.sheets)) {
					const worksheet = workbook.getSheetBySheetId(sheetId)
					
					if (!worksheet) {
						console.warn(`[UniverRenderer] Sheet ${sheetId} 不存在，跳过更新`)
						continue
					}

					// 使用 SetRangeValuesMutation 更新单元格数据
					if (sheetData.cellData) {
						await commandService.executeCommand(SetRangeValuesMutation.id, {
							unitId: this.workbookId,
							subUnitId: sheetId,
							cellValue: sheetData.cellData,
						})
					}
				}
			}
			
			console.log("[UniverRenderer] 增量更新 worksheet 数据完成")
		} catch (error) {
			console.error("[UniverRenderer] 更新 worksheet 数据失败:", error)
			throw error
		}
	}

	/** 加载新文件（全量替换） */
	public async loadFile(file: File): Promise<void> {
		if (!this.univer || !this.workbookId || !this.workerManager) {
			console.error("[UniverRenderer] 无法获取 workbook 实例")
			return
		}

		try {
			const univerInstanceService = this.univer.__getInjector().get(IUniverInstanceService)
			
			// 转换文件数据
			const isReadonly = this.config.mode === "readonly"
			const workbookData = await this.workerManager.transformData(file, file.name, isReadonly)
			
			// 全量替换：销毁旧的，创建新的
			univerInstanceService.disposeUnit(this.workbookId)
			this.workbookId = workbookData.id as string
			this.univer.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData)
			
			// 重新配置权限
			this.configurePermissions()
			
			if (this.config.mode === "readonly") {
				this.setupReadonlyBehavior()
			}
			
			// 重新设置编辑监听器（监听器在销毁 workbook 时会失效）
			if (this.config.onDataChange) {
				const data = this.getWorksheetData()
				if (data) {
					// 延迟触发，确保 UI 已经更新
					setTimeout(() => {
						this.config.onDataChange?.(data)
					}, 100)
				}
			}
			
			console.log("[UniverRenderer] 文件加载完成:", file.name)
		} catch (error) {
			console.error("[UniverRenderer] 加载文件失败:", error)
			throw error
		}
	}
}
