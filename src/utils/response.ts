import { type FastifyReply } from 'fastify'

import { getReasonPhrase, ReasonPhrases, StatusCodes } from 'http-status-codes'

import { ErrorEntry } from '../config/error-codes.js'
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
export function toSuccessResponse<T>(
  data: T,
  statusKey: 'OK' | 'CREATED' = 'OK'
): ApiResponse<T> {
  return {
    statusCode: StatusCodes[statusKey],
    message: ReasonPhrases[statusKey],
    result: data
  }
}

export function sendError(reply: FastifyReply, error: ErrorEntry) {
  return reply.code(error.__httpCode).send({
    statusCode: error.statusCode ?? error.__httpCode,
    message: error.message ?? getReasonPhrase(error.__httpCode)
  })
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
