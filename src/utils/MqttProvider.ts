/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as url from 'url'
import { type RPSConfig, type eventType, type OpenAMTEvent } from '../models'
import { type MqttClient, connect, type IClientOptions } from 'mqtt'
import Logger from '../Logger'
const log: Logger = new Logger('MqttProvider')

export class MqttProvider {
  client: MqttClient
  turnedOn: boolean
  mqttUrl: url.URL
  baseUrl: string
  port: number
  options: IClientOptions

  // A global instance of the MqttProvider to be accessed across rps
  static instance: MqttProvider

  constructor (config: RPSConfig) {
    if (!config?.mqtt_address) {
      log.info('MQTT is turned off')
    } else {
      this.turnedOn = true
      this.mqttUrl = new url.URL(config.mqtt_address)
      this.baseUrl = 'mqtt://' + this.mqttUrl.host
      this.port = +this.mqttUrl.port
      this.options = {
        port: this.port,
        clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8)
        // username: auth[0],
        // password: auth[1],
      }
    }
  }

  connectBroker (): void {
    if (!this.turnedOn) return

    this.client = connect(this.baseUrl, this.options)
    MqttProvider.instance = this
  }

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  // Return type is any to get around the linter - Rule : no-floating-promises
  // Publish event is meant to be fire and forget
  static publishEvent (type: eventType, methods: string[], message: string, guid?: string): any {
    // Block message if mqtt option is off
    if (!MqttProvider.instance?.turnedOn) return

    const event: OpenAMTEvent = {
      type,
      message,
      methods,
      guid,
      timestamp: Date.now()
    }

    // Enforce message type names before publishing
    return new Promise((resolve, reject) => {
      MqttProvider.instance.client.publish('rps/events', JSON.stringify(event), function (err) {
        if (err == null) {
          log.info('Event message published')
          resolve(null)
        } else {
          log.error('Event message failed')
          reject(new Error('Event message failed: ' + err.message))
        }
      })
    })
  }

  static endBroker (): void {
    if (!MqttProvider.instance?.turnedOn) return

    MqttProvider.instance.client = MqttProvider.instance.client.end()
    log.info('MQTT client closed')
  }
}
