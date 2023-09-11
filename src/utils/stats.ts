/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { StatsD } from 'hot-shots'
import { Environment } from './Environment'

class StatsDClient {
  private static instance: StatsDClient
  private client: StatsD

  private constructor () {

  }

  public static getInstance (): StatsDClient {
    if (!StatsDClient.instance) {
      StatsDClient.instance = new StatsDClient()
    }

    return StatsDClient.instance
  }

  public Initialize (): void {
    this.client = new StatsD({
      host: Environment.Config.telegraf_host,
      port: Environment.Config.telegraf_port,
      globalTags: { service: 'rps' },
      errorHandler: this.errorHandler
    })
  }

  private errorHandler (error: Error): void {
    console.error('Error encountered in StatsD client:', error)
  }

  public increment (stat: string, tags?: string[] | Record<string, string>): void {
    this.client.increment('rps.' + stat, tags)
  }

  public decrement (stat: string, tags?: string[], sampleRate?: number): void {
    this.client.decrement('rps.' + stat, 1, sampleRate, tags)
  }

  public timing (stat: string, value: number): void {
    this.client.timing('rps.' + stat, value)
  }

  public event (title: string, text?: string, options?: any, tags?: string[]): void {
    this.client.event(title, text, options, tags)
  }

  public close (callback?: (error?: Error) => void): void {
    this.client.close(callback)
  }
}

// Export the singleton instance
const statsD = StatsDClient.getInstance()
export default statsD
