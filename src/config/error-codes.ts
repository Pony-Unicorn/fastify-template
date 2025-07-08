import { ReasonPhrases, StatusCodes } from 'http-status-codes'

export type ErrorEntry = {
  __httpCode: StatusCodes
  statusCode?: number
  message?: string
}

const ERROR_CODES = {
  MISSING_PARAM: {
    __httpCode: StatusCodes.BAD_REQUEST,
    statusCode: 400001,
    message: 'Missing required parameter'
  },
  INVALID_PARAM: {
    __httpCode: StatusCodes.BAD_REQUEST,
    statusCode: 400002,
    message: 'Invalid parameter'
  },
  NOT_LOGGED: {
    __httpCode: StatusCodes.UNAUTHORIZED,
    statusCode: 401001,
    message: 'Not logged in'
  },
  TOKEN_EXPIRED: {
    __httpCode: StatusCodes.UNAUTHORIZED,
    statusCode: 401002,
    message: 'Token expired'
  },
  USER_DISABLED: {
    __httpCode: StatusCodes.FORBIDDEN,
    statusCode: 403002,
    message: 'User account disabled'
  },
  USER_NOT_FOUND: {
    __httpCode: StatusCodes.NOT_FOUND,
    statusCode: 404001,
    message: 'User not found'
  },
  INTERNAL_ERROR: {
    __httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
    statusCode: 500,
    message: ReasonPhrases.INTERNAL_SERVER_ERROR
  },
  DATABASE_ERROR: {
    __httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
    statusCode: 500001,
    message: 'Database error'
  }
} as const satisfies Record<string, ErrorEntry>

export default ERROR_CODES
