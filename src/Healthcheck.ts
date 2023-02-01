/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { request } from 'http'
import { type RequestOptions } from 'https'

const options: RequestOptions = {
  host: 'localhost',
  port: process.env.RPSWEBPORT ?? 8081,
  timeout: 2000,
  path: '/api/v1/admin/health'
}

const health = request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`)
  if (res.statusCode === 200) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})

health.on('error', (err) => {
  console.error(err)
  process.exit(1)
})

health.end()
