/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as winston from 'winston'
import { ILogger } from './interfaces/ILogger'

const { combine, timestamp, printf } = winston.format
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

// file logging removed to avoid disk space consumption and
// adhere to non-root user requirements
// const logFile = path.join(__dirname, '/logs/logs.txt')

const logger = winston.createLogger({
  level: process.env.RPS_LOG_LEVEL as winston.level || 'info',
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

  constructor (name: string) {
    this.name = name
  }

  debug (log: string, ...params: any[]): void {
    logger.debug([this.name + ' - ' + log].concat(params))
  }

  info (log: string, ...params: any[]): void {
    logger.info([this.name + ' - ' + log].concat(params))
  }

  warn (log: string, ...params: any[]): void {
    logger.warn([this.name + ' - ' + log].concat(params))
  }

  error (log: string, ...params: any[]): void {
    logger.error([this.name + ' - ' + log].concat(params))
  }

  verbose (log: string, ...params: any[]): void {
    logger.verbose([this.name + ' - ' + log].concat(params))
  }

  silly (log: string, ...params: any[]): void {
    logger.silly([this.name + ' - ' + log].concat(params))
  }
}

export default Logger
