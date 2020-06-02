/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as winston from 'winston';
import { ILogger } from './interfaces/ILogger';

const { combine, timestamp, printf } = winston.format;
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

const logger = winston.createLogger({
  level: "debug",
  format: combine(timestamp(), myFormat),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: __dirname + "/debug.log"
    })
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: __dirname + "/exceptions.log"
    })
  ],
  exitOnError: false
});

class Logger implements ILogger{
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  debug(log: string, ...params: any[]) {
    logger.debug([this.name + ' - ' + log].concat(params));
  }

  info(log: string, ...params: any[]) {
    logger.info([this.name + ' - ' + log].concat(params));
  }

  warn(log: string, ...params: any[]) {
    logger.warn([this.name + ' - ' + log].concat(params));
  }

  error(log: string, ...params: any[]) {
    logger.error([this.name + ' - ' + log].concat(params));
  }
}

export default function(name: string): ILogger{
  return new Logger(name);
}