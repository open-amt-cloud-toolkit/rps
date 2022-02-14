import { HttpHandler } from '../../HttpHandler'
import { IClientManager } from '../../interfaces/IClientManager'
import { IConfigurator } from '../../interfaces/IConfigurator'
import Logger from '../../Logger'
import { ClientMsg, ClientObject } from '../../models/RCS.Config'
import { ClientResponseMsg } from '../ClientResponseMsg'
import { EnvReader } from '../EnvReader'
import { MqttProvider } from '../MqttProvider'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { parseBody } from '../parseWSManResponseBody'

const logger = new Logger('setMEBXPassword')
const amt = new AMT.Messages()

export const setMEBXPassword = async (clientId: string, message: any, responseMsg: ClientResponseMsg, clientManager: IClientManager, configurator: IConfigurator, httpHandler: HttpHandler): Promise<ClientMsg> => {
  const clientObj = clientManager.getClientObject(clientId)
  const mebxPassword: string = await configurator.profileManager.getMEBxPassword(clientObj.ClientData.payload.profile.profileName)
  if (message === '') {
    const xmlRequestBody = amt.SetupAndConfigurationService(AMT.Methods.SET_MEBX_PASSWORD, (clientObj.messageId++).toString(), mebxPassword)
    const wsmanRequest = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok', 'alls good!')
  }
  switch (message.statusCode) {
    case 401: {
      const xmlRequestBody = amt.SetupAndConfigurationService(AMT.Methods.SET_MEBX_PASSWORD, (clientObj.messageId++).toString(), mebxPassword)
      const wsmanRequest = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
      return responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok', 'alls good!')
    }
    case 200: {
      const xmlBody = parseBody(message)
      const response = httpHandler.parseXML(xmlBody)
      if (response.Envelope.Body.SetMEBxPassword_OUTPUT.ReturnValue !== 0) {
        return failureResponse(clientId, clientObj, responseMsg)
      }
      clientObj.mebxPassword = mebxPassword
      if (configurator?.amtDeviceRepository) {
        const amtDevice = {
          guid: clientObj.uuid,
          name: clientObj.hostname,
          mpsuser: clientObj.mpsUsername,
          mpspass: clientObj.mpsPassword,
          amtuser: EnvReader.GlobalEnvConfig.amtusername,
          amtpass: clientObj.amtPassword,
          mebxpass: clientObj.mebxPassword
        }
        await configurator.amtDeviceRepository.insert(amtDevice)
      } else {
        MqttProvider.publishEvent('fail', ['setMEBXPassword'], 'Unable to write device', clientObj.uuid)
        logger.error('unable to write device')
      }
      clientObj.status.Status = (clientObj.status.Status == null) ? 'MEBx Password updated' : `${clientObj.status.Status}, MEBx Password updated`
      clientManager.setClientObject(clientObj)
      return responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
    }
    default: {
      return failureResponse(clientId, clientObj, responseMsg)
    }
  }
}

function failureResponse (clientId: string, clientObj: ClientObject, responseMsg: ClientResponseMsg): ClientMsg {
  clientObj.status.Status = (clientObj.status.Status == null) ? 'Failed to update MEBx Password' : `${clientObj.status.Status}, Failed to update MEBx Password`
  return responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
}
