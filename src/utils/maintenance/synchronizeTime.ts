import { IClientManager } from '../../interfaces/IClientManager'
import { WSManProcessor } from '../../WSManProcessor'
import { AMTUserName } from '../constants'
import { RPSError } from '../RPSError'

export const synchronizeTime = async (clientId: string, message: any, amtwsman: WSManProcessor, clientManager: IClientManager): Promise<boolean> => {
  const clientObj = clientManager.getClientObject(clientId)
  const wsmanResponse = message?.payload
  if (wsmanResponse.Header?.Method) {
    if (wsmanResponse.Body?.ReturnValue !== 0) {
      throw new RPSError(`${wsmanResponse.Header.Method} failed for ${clientObj.uuid}`)
    }
    switch (wsmanResponse.Header.Method) {
      case 'GetLowAccuracyTimeSynch': {
        const Tm1 = Math.round(new Date().getTime() / 1000)
        await amtwsman.execute(clientId, 'AMT_TimeSynchronizationService', 'SetHighAccuracyTimeSynch', { Ta0: wsmanResponse?.Body?.Ta0, Tm1: Tm1, Tm2: Tm1 }, null, AMTUserName, clientObj.ClientData.payload.password)
        break
      }
      case 'SetHighAccuracyTimeSynch': {
        return true
      }
    }
  } else {
    await amtwsman.execute(clientId, 'AMT_TimeSynchronizationService', 'GetLowAccuracyTimeSynch', {}, null, AMTUserName, clientObj.ClientData.payload.password)
  }
  return false
}
