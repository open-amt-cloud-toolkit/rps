/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Helps to implement specific action object during runtime
 **********************************************************************/

import Logger from './Logger'
import { ClientMsg, ClientAction } from './RCS.Config'
import { IConfigurator } from './interfaces/IConfigurator'
import { ILogger } from './interfaces/ILogger'
import { ICertManager } from './interfaces/ICertManager'
import { SignatureHelper } from './utils/SignatureHelper'

import { ACMActivator } from './actions/ACMActivator'
import { CCMActivator } from './actions/CCMActivator'
import { ClientResponseMsg } from './utils/ClientResponseMsg'
import { WSManProcessor } from './WSManProcessor'
import { IClientManager } from './interfaces/IClientManager'
import { IValidator } from './interfaces/IValidator'
import { RPSError } from './utils/RPSError'
import { Deactivator } from './actions/Deactivator'
import { CIRAConfigurator } from './actions/CIRAConfigurator'
import { NetworkConfigurator } from './actions/NetworkConfigurator'
import { ISecretManagerService } from './interfaces/ISecretManagerService'

export class ClientActions {
  actions: any;

  constructor (
    private logger: ILogger,
    private configurator: IConfigurator,
    private certManager: ICertManager,
    private helper: SignatureHelper,
    private responseMsg: ClientResponseMsg,
    private amtwsman: WSManProcessor,
    private clientManager: IClientManager,
    private validator: IValidator,
    private secretsManager?: ISecretManagerService) {
    this.actions = {}

    const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, amtwsman, clientManager)
    this.actions[ClientAction.CIRACONFIG] = ciraConfig

    const networkConfig = new NetworkConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, amtwsman, clientManager, validator, ciraConfig)
    this.actions[ClientAction.NETWORKCONFIG] = networkConfig

    this.actions[ClientAction.ADMINCTLMODE] = new ACMActivator(new Logger('ACMActivator'), configurator, certManager, helper, responseMsg, amtwsman, clientManager, validator, networkConfig)
    this.actions[ClientAction.CLIENTCTLMODE] = new CCMActivator(new Logger('CCMActivator'), configurator, responseMsg, amtwsman, clientManager, validator, networkConfig)
    this.actions[ClientAction.DEACTIVATE] = new Deactivator(new Logger('Deactivator'), responseMsg, amtwsman, clientManager, configurator)
  }

  /**
   * @description Helps to get response data of the specific action object.
   * @param {any} message
   * @param {string} clientId
   * @param {any} config
   * @returns {Boolean} Returns response message if action object exists. Returns null if action object does not exists.
   */
  async buildResponseMessage (message: any, clientId: string): Promise<ClientMsg> {
    const clientObj = this.clientManager.getClientObject(clientId)
    if (clientObj.action) {
      if (this.actions[clientObj.action]) {
        return await this.actions[clientObj.action].execute(message, clientId)
      } else {
        throw new RPSError(`Device ${clientObj.uuid} - Not supported action.`)
      }
    } else {
      throw new RPSError('Failed to retrieve the client message')
    }
  }
}
