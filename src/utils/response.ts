import { ResponseJson } from '../schemas/common.js'

// 通用响应结构类型
export type ApiResponse<T> = Omit<ResponseJson, 'result'> & {
  result: T | null
}

/**
 * 返回成功响应
 * @param data 任意类型的数据
 * @returns ApiResponse<T>
 */
export function toSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    statusCode: 200,
    message: 'OK',
    result: data
  }
}

/**
 * 返回错误响应
 * @param statusCode HTTP 状态码，默认 500
 * @param message 错误信息
 * @returns ApiResponse<null>
 */
export function toErrorResponse(
  statusCode: number = 500,
  message: string = 'Internal Server Error'
): ApiResponse<null> {
  return {
    statusCode,
    message,
    result: null
  }
}

/**
 * 分页响应结构
 */
// export function toPaginatedResponse<T>(
//   items: T[],
//   total: number
// ): ApiResponse<{ items: T[]; total: number }> {
//   return toSuccessResponse({ items, total })
// }
