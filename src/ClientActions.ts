/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Helps to implement specific action object during runtime
 **********************************************************************/

import Logger from './Logger'
import { ClientMsg, ClientAction } from './models/RCS.Config'
import { IConfigurator } from './interfaces/IConfigurator'
import { ILogger } from './interfaces/ILogger'
import { SignatureHelper } from './utils/SignatureHelper'
import { Activator } from './actions/Activator'
import { ClientResponseMsg } from './utils/ClientResponseMsg'
import { WSManProcessor } from './WSManProcessor'
import { IValidator } from './interfaces/IValidator'
import { RPSError } from './utils/RPSError'
import { Deactivator } from './actions/Deactivator'
import { CIRAConfigurator } from './actions/CIRAConfigurator'
import { NetworkConfigurator } from './actions/NetworkConfigurator'
import { TLSConfigurator } from './actions/TLSConfigurator'
import { CertManager } from './CertManager'
import { Maintenance } from './actions/Maintenance'
import { HttpHandler } from './HttpHandler'
import { devices } from './WebSocketListener'

export class ClientActions {
  actions: any

  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly certManager: CertManager,
    private readonly helper: SignatureHelper,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly validator: IValidator) {
    this.actions = {}

    const tlsConfig = new TLSConfigurator(new Logger('TLSConfig'), certManager, responseMsg, amtwsman)
    this.actions[ClientAction.TLSCONFIG] = tlsConfig

    const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, tlsConfig)
    this.actions[ClientAction.CIRACONFIG] = ciraConfig

    const networkConfig = new NetworkConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, validator, ciraConfig)
    this.actions[ClientAction.NETWORKCONFIG] = networkConfig

    this.actions[ClientAction.MAINTENANCE] = new Maintenance(new Logger('Maintenance'), responseMsg)
    this.actions[ClientAction.ADMINCTLMODE] = new Activator(new Logger('Activator'), configurator, certManager, helper, responseMsg, validator, networkConfig)
    this.actions[ClientAction.CLIENTCTLMODE] = new Activator(new Logger('Activator'), configurator, certManager, helper, responseMsg, validator, networkConfig)
    this.actions[ClientAction.DEACTIVATE] = new Deactivator(new Logger('Deactivator'), responseMsg, configurator)
  }

  /**
   * @description Helps to get response data of the specific action object.
   * @param {any} message
   * @param {string} clientId
   * @param {any} config
   * @returns {Boolean} Returns response message if action object exists. Returns null if action object does not exists.
   */
  async buildResponseMessage (message: ClientMsg, clientId: string, httpHandler?: HttpHandler): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    if (clientObj.action) {
      if (this.actions[clientObj.action]) {
        // eslint-disable-next-line @typescript-eslint/return-await
        return await this.actions[clientObj.action].execute(message, clientId, httpHandler)
      } else {
        throw new RPSError(`Device ${clientObj.uuid} - Not supported action.`)
      }
    } else {
      throw new RPSError('Failed to retrieve the client message')
    }
  }
}
