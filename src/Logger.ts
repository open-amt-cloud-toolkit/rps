/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import winston from 'winston'
import { type ILogger } from './interfaces/ILogger.js'

const { combine, timestamp, printf } = winston.format
const myFormat = printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)

// file logging removed to avoid disk space consumption and
// adhere to non-root user requirements
// const logFile = path.join(__dirname, '/logs/logs.txt')
// Note: __dirname removed in ESM

const logger = winston.createLogger({
  level: process.env.RPS_LOG_LEVEL ?? 'info',
  format: combine(timestamp(), myFormat),
  transports: [
    new winston.transports.Console()
    // new winston.transports.File({
    //   filename: logFile
    // })
  ],
  exceptionHandlers: [
    new winston.transports.Console()
    // new winston.transports.File({
    //   filename: logFile
    // })
  ],
  exitOnError: false
})

class Logger implements ILogger {
  private readonly name: string

  constructor(name: string) {
    this.name = name
  }

  debug(log: string, ...params: any[]): void {
    logger.debug([this.name + ' - ' + log].concat(params))
  }

  info(log: string, ...params: any[]): void {
    logger.info([this.name + ' - ' + log].concat(params))
  }

  warn(log: string, ...params: any[]): void {
    logger.warn([this.name + ' - ' + log].concat(params))
  }

  error(log: string, ...params: any[]): void {
    logger.error([this.name + ' - ' + log].concat(params))
  }

  verbose(log: string, ...params: any[]): void {
    logger.verbose([this.name + ' - ' + log].concat(params))
  }

  silly(log: string, ...params: any[]): void {
    logger.silly([this.name + ' - ' + log].concat(params))
  }
}

export default Logger
