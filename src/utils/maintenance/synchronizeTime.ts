import { IClientManager } from '../../interfaces/IClientManager'
import { ClientMsg, ClientObject } from '../../models/RCS.Config'
import { ClientResponseMsg } from '../ClientResponseMsg'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { parseBody } from '../parseWSManResponseBody'
import Logger from '../../Logger'

const logger = new Logger('synchronizeTime')
const amt = new AMT.Messages()

export const synchronizeTime = async (clientId: string, message: any, responseMsg: ClientResponseMsg, clientManager: IClientManager, httpHandler): Promise<ClientMsg> => {
  const clientObj = clientManager.getClientObject(clientId)
  const wsmanResponse = message?.payload
  if (wsmanResponse.statusCode == null) {
    const xmlRequestBody = amt.TimeSynchronizationService(AMT.Methods.GET_LOW_ACCURACY_TIME_SYNCH, (clientObj.messageId++).toString())
    const wsmanRequest = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok', 'alls good!')
  }
  switch (wsmanResponse.statusCode) {
    case 401: {
      const xmlRequestBody = amt.TimeSynchronizationService(AMT.Methods.GET_LOW_ACCURACY_TIME_SYNCH, (clientObj.messageId++).toString())
      const wsmanRequest = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
      return responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok', 'alls good!')
    }
    case 200: {
      const xmlBody = parseBody(wsmanResponse)
      const response = httpHandler.parseXML(xmlBody)
      const method = response.Envelope.Header.ResourceURI.split('/').pop()
      const action = response.Envelope.Header.Action.split('/').pop()
      logger.silly(`Device ${clientObj.uuid} : ${JSON.stringify(response, null, '\t')}`)
      if (method === 'AMT_TimeSynchronizationService' && action === 'GetLowAccuracyTimeSynchResponse') {
        if (response.Envelope.Body.GetLowAccuracyTimeSynch_OUTPUT.ReturnValue !== 0) {
          return failureResponse(clientId, clientObj, responseMsg)
        }
        const Tm1 = Math.round(new Date().getTime() / 1000)
        const Ta0 = response.Envelope.Body.GetLowAccuracyTimeSynch_OUTPUT.Ta0
        const xmlRequestBody = amt.TimeSynchronizationService(AMT.Methods.SET_HIGH_ACCURACY_TIME_SYNCH, (clientObj.messageId++).toString(), Ta0, Tm1, Tm1)
        const wsmanRequest = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
        return responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok', 'alls good!')
      } else if (method === 'AMT_TimeSynchronizationService' && action === 'SetHighAccuracyTimeSynchResponse') {
        if (response.Envelope.Body.SetHighAccuracyTimeSynch_OUTPUT.ReturnValue !== 0) {
          return failureResponse(clientId, clientObj, responseMsg)
        }
        clientObj.status.Status = 'Time Synchronized'
        return responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
      } else {
        return failureResponse(clientId, clientObj, responseMsg)
      }
    }
    default: {
      return failureResponse(clientId, clientObj, responseMsg)
    }
  }
}

function failureResponse (clientId: string, clientObj: ClientObject, responseMsg: ClientResponseMsg): ClientMsg {
  clientObj.status.Status = 'Failed to Synchronize time'
  return responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
}
