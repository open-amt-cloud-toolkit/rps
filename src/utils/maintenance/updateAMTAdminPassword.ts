import got from 'got/dist/source'
import { IClientManager } from '../../interfaces/IClientManager'
import { IConfigurator } from '../../interfaces/IConfigurator'
import { IValidator } from '../../interfaces/IValidator'
import Logger from '../../Logger'
// import { NodeForge } from '../../NodeForge'
import { AMTDeviceDTO } from '../../repositories/dto/AmtDeviceDTO'
import { WSManProcessor } from '../../WSManProcessor'
import { AMTUserName } from '../constants'
import { EnvReader } from '../EnvReader'
import { MqttProvider } from '../MqttProvider'
import { RPSError } from '../RPSError'
import { SignatureHelper } from '../SignatureHelper'

export const updateAMTAdminPassword = async (clientId: string, message: any, amtwsman: WSManProcessor, clientManager: IClientManager, configurator: IConfigurator, validator: IValidator): Promise<boolean> => {
  const logger = new Logger('updateAMTAdminPassword')
  const clientObj = clientManager.getClientObject(clientId)
  const wsmanResponse = message
  if (wsmanResponse?.Header?.Method) {
    if (wsmanResponse.Body?.ReturnValue !== 0) {
      throw new RPSError(`${wsmanResponse.Header.Method} failed for ${clientObj.uuid}`)
    }
    MqttProvider.publishEvent('success', ['updateAMTAdminPassword'], 'AMT admin Password updated', clientObj.uuid)
    return true
  } else if (wsmanResponse.AMT_GeneralSettings != null) {
    // Response from GeneralSettings wsman call
    const digestRealm = wsmanResponse.AMT_GeneralSettings.response.DigestRealm
    // Validate Digest Realm
    if (!validator.isDigestRealmValid(digestRealm)) {
      throw new RPSError(`Device ${clientObj.uuid} activation failed. Not a valid digest realm.`)
    }
    if (!configurator?.amtDeviceRepository) {
      MqttProvider.publishEvent('fail', ['updateAMTAdminPassword'], 'Unable to write device', clientObj.uuid)
      logger.error('unable to write device')
    }
    const amtPassword: string = await configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.profileName)
    clientObj.amtPassword = amtPassword
    clientObj.ClientData.payload.digestRealm = digestRealm
    clientObj.hostname = clientObj.ClientData.payload.hostname
    clientManager.setClientObject(clientObj)
    await configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
      clientObj.hostname,
      null,
      null,
      EnvReader.GlobalEnvConfig.amtusername,
      clientObj.amtPassword,
      null
    ))
    /* Register device metadata with MPS */
    try {
      const profile = await configurator.profileManager.getAmtProfile(clientObj.ClientData.payload.profile.profileName)
      let tags = []
      if (profile?.tags != null) {
        tags = profile.tags
      }
      await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
        method: 'POST',
        json: {
          guid: clientObj.uuid,
          hostname: clientObj.hostname,
          mpsusername: clientObj.mpsUsername,
          tags: tags,
          tenantId: profile.tenantId
        }
      })
    } catch (err) {
      MqttProvider.publishEvent('fail', ['Activator'], 'unable to register metadata with MPS', clientObj.uuid)
      logger.error('unable to register metadata with MPS', err)
    }
    const data: string = `admin:${clientObj.ClientData.payload.digestRealm}:${amtPassword}`
    // Convert data to MD5
    const hash = SignatureHelper.createMd5Hash(data)
    // Convert MD5 hash to raw string which utf16
    const result = hash.match(/../g).map((v) => String.fromCharCode(parseInt(v, 16))).join('')
    // Encode to base64
    const password = Buffer.from(result, 'binary').toString('base64')
    await amtwsman.execute(clientId, 'AMT_AuthorizationService', 'SetAdminAclEntryEx', { Username: AMTUserName, DigestPassword: password }, null)
  }
  return false
}
