import { IClientManager } from '../interfaces/IClientManager'
import { IConfigurator } from '../interfaces/IConfigurator'
import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg, ClientObject } from '../RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { synchronizeTime } from '../utils/maintenance/synchronizeTime'
import { MqttProvider } from '../utils/MqttProvider'
import { RPSError } from '../utils/RPSError'
import { WSManProcessor } from '../WSManProcessor'

export class Maintenance implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly clientManager: IClientManager
  ) { }

  async execute (message: any, clientId: string): Promise<ClientMsg> {
    const clientObj: ClientObject = this.clientManager.getClientObject(clientId)
    const payload: any = clientObj.ClientData.payload
    try {
      switch (payload.task) {
        case 'synctime': {
          const result = await synchronizeTime(clientId, message, this.amtwsman, this.clientManager)
          if (result) {
            return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify({ status: 'Time Synchronized' }))
          }
          break
        }
        default: {
          return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify({ status: 'Not a supported maintenance task' }))
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure maintenance task-${payload.task}: ${error}`)
      MqttProvider.publishEvent('fail', ['Maintenance'], 'Failed', clientObj.uuid)
      let errorStatus
      if (error instanceof RPSError) {
        errorStatus = error.message
      } else {
        errorStatus = 'Failed'
      }
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify({ status: errorStatus }))
    }
  }
}
