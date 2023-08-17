/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { StatsD } from 'hot-shots'

class StatsDClient {
  private static instance: StatsDClient
  private readonly client: StatsD

  private constructor () {
    this.client = new StatsD({
      host: 'telegraf',
      port: 8020,
      globalTags: { service: 'rps' },
      errorHandler: this.errorHandler
    })
  }

  public static getInstance (): StatsDClient {
    if (!StatsDClient.instance) {
      StatsDClient.instance = new StatsDClient()
    }

    return StatsDClient.instance
  }

  private errorHandler (error: Error): void {
    console.error('Error encountered in StatsD client:', error)
  }

  public increment (stat: string, value?: number, sampleRate?: number, tags?: string[] | Record<string, string>): void {
    this.client.increment('rps.' + stat, value, sampleRate, tags)
  }

  public decrement (stat: string, tags?: string[], sampleRate?: number): void {
    this.client.decrement('rps.' + stat, 1, sampleRate, tags)
  }

  public timing (stat: string, value: number): void {
    this.client.timing('rps.' + stat, value)
  }

  public close (callback?: (error?: Error) => void): void {
    this.client.close(callback)
  }
}

// Export the singleton instance
const statsD = StatsDClient.getInstance()
export default statsD
