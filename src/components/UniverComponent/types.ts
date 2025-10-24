import type { IWorkbookData } from "@univerjs/core"

/** 支持的文件类型 */
export type SupportedFileType = "sheet" | "slide" | "doc"

/** 组件模式 */
export type ComponentMode = "readonly" | "edit"

/** 尺寸类型 */
export type SizeValue = number | string

/** Univer 组件属性接口 */
export interface UniverComponentNewProps {
	/** 要显示的数据 - 支持 File 或 JSON 对象 */
	data: File | Partial<IWorkbookData>
	/** 组件宽度 */
	width?: SizeValue
	/** 组件高度 */
	height?: SizeValue
	/** 组件模式 */
	mode?: ComponentMode
	/** 数据变化回调 */
	onDataChange?: (data: Partial<IWorkbookData>) => void
}

/** Worker 消息类型枚举 */
export enum TransformWorkerMessageType {
	TRANSFORM_REQUEST = "TRANSFORM_REQUEST", // 转换请求
	TRANSFORM_RESPONSE = "TRANSFORM_RESPONSE", // 转换响应
	TRANSFORM_ERROR = "TRANSFORM_ERROR", // 转换错误
}

/** Worker 请求载荷接口 */
export interface WorkerRequestPayload {
	/** 任务 ID */
	id: string
	/** 要处理的数据 - 支持 File 或 JSON 对象 */
	data: File | Partial<IWorkbookData>
	/** 文件名称 */
	fileName?: string
	/** 是否为只读模式 */
	isReadonly?: boolean
}

/** Worker 请求消息接口 */
export interface WorkerMessage {
	type: TransformWorkerMessageType
	payload: WorkerRequestPayload
}

/** Worker 错误信息接口 */
export interface WorkerError {
	/** 错误消息 */
	message: string
	/** 错误堆栈 */
	stack?: string
}

/** Worker 响应载荷接口 */
export interface WorkerResponsePayload {
	/** 任务 ID */
	id: string
	/** 处理结果 */
	result?: Partial<IWorkbookData>
	/** 错误信息 */
	error?: WorkerError
}

/** Worker 响应消息接口 */
export interface WorkerResponse {
	type: TransformWorkerMessageType
	payload: WorkerResponsePayload
}

/** Worker 任务接口 - 用于跟踪单个转换任务的状态 */
export interface TransformTask {
	id: string
	resolve: (value: Partial<IWorkbookData>) => void
	reject: (error: Error) => void
}
