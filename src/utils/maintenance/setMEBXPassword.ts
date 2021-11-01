import { IClientManager } from '../../interfaces/IClientManager'
import { IConfigurator } from '../../interfaces/IConfigurator'
import Logger from '../../Logger'
import { AMTDeviceDTO } from '../../repositories/dto/AmtDeviceDTO'
import { WSManProcessor } from '../../WSManProcessor'
import { EnvReader } from '../EnvReader'
import { MqttProvider } from '../MqttProvider'
import { RPSError } from '../RPSError'

export const setMEBXPassword = async (clientId: string, message: any, amtwsman: WSManProcessor, clientManager: IClientManager, configurator: IConfigurator): Promise<boolean> => {
  const logger = new Logger('setMEBXPassword')
  const clientObj = clientManager.getClientObject(clientId)
  const wsmanResponse = message
  if (wsmanResponse?.Header?.Method) {
    if (wsmanResponse.Body?.ReturnValue !== 0) {
      throw new RPSError(`${wsmanResponse.Header.Method} failed for ${clientObj.uuid}`)
    }
    return true
  } else {
    /* Get the MEBx password */
    const mebxPassword: string = await configurator.profileManager.getMEBxPassword(clientObj.ClientData.payload.profile.profileName)
    clientObj.mebxPassword = mebxPassword
    clientManager.setClientObject(clientObj)
    if (configurator?.amtDeviceRepository) {
      await configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
        clientObj.hostname,
        clientObj.mpsUsername,
        clientObj.mpsPassword,
        EnvReader.GlobalEnvConfig.amtusername,
        clientObj.amtPassword,
        clientObj.mebxPassword
      ))
    } else {
      MqttProvider.publishEvent('fail', ['setMEBXPassword'], 'Unable to write device', clientObj.uuid)
      logger.error('unable to write device')
    }
    await amtwsman.execute(clientId, 'AMT_SetupAndConfigurationService', 'SetMEBxPassword', { Password: mebxPassword }, null)
  }
  return false
}
