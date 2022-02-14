import got from 'got'
import { HttpHandler } from '../../HttpHandler'
import { IClientManager } from '../../interfaces/IClientManager'
import { IConfigurator } from '../../interfaces/IConfigurator'
import { IValidator } from '../../interfaces/IValidator'
import Logger from '../../Logger'
import { AMTUserName } from '../constants'
import { EnvReader } from '../EnvReader'
import { MqttProvider } from '../MqttProvider'
import { RPSError } from '../RPSError'
import { SignatureHelper } from '../SignatureHelper'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { parseBody } from '../parseWSManResponseBody'
import { ClientResponseMsg } from '../ClientResponseMsg'
import { ClientMsg } from '../../models/RCS.Config'

const amt = new AMT.Messages()

export const updateAMTAdminPassword = async (clientId: string, message: any, responseMsg: ClientResponseMsg, clientManager: IClientManager, configurator: IConfigurator, validator: IValidator, httpHandler: HttpHandler): Promise<ClientMsg> => {
  const logger = new Logger('updateAMTAdminPassword')
  const clientObj = clientManager.getClientObject(clientId)
  switch (message.statusCode) {
    case 401: {
      const xmlRequestBody = amt.GeneralSettings(AMT.Methods.GET, (clientObj.messageId++).toString())
      const data = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
      return responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
    }
    case 200: {
      let xmlBody
      try {
        xmlBody = parseBody(message)
      } catch (err) {
        MqttProvider.publishEvent('fail', ['Activator'], 'Failed to parse WSMan response', clientObj.uuid)
        clientObj.status.Status = 'Failed to update AMT admin password'
        return responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
      }
      // pares WSMan xml response to json
      const response = httpHandler.parseXML(xmlBody)
      const method = response.Envelope.Header.ResourceURI.split('/').pop()
      switch (method) {
        case 'AMT_GeneralSettings': {
          // Response from GeneralSettings wsman call
          const digestRealm = response.Envelope.Body.AMT_GeneralSettings.DigestRealm
          // Validate Digest Realm
          if (!validator.isDigestRealmValid(digestRealm)) {
            throw new RPSError(`Device ${clientObj.uuid} activation failed. Not a valid digest realm.`)
          }
          const amtPassword: string = await configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.profileName)
          clientObj.amtPassword = amtPassword
          clientObj.ClientData.payload.digestRealm = digestRealm
          clientObj.hostname = clientObj.ClientData.payload.hostname
          clientManager.setClientObject(clientObj)
          try {
            const amtDevice = {
              guid: clientObj.uuid,
              name: clientObj.hostname,
              amtuser: EnvReader.GlobalEnvConfig.amtusername,
              amtpass: clientObj.amtPassword
            }
            await configurator.amtDeviceRepository.insert(amtDevice)
          } catch (err) {
            MqttProvider.publishEvent('fail', ['Activator'], 'unable to register credentials with vault', clientObj.uuid)
            logger.error('unable to register metadata with MPS', err)
          }
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
          const xmlRequestBody = amt.AuthorizationService(AMT.Methods.SET_ADMIN_ACL_ENTRY_EX, (clientObj.messageId++).toString(), AMTUserName, password)
          const wsmanRequest = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
          return responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok', 'alls good!')
        }
        case 'AMT_AuthorizationService': {
          if (response.Envelope.Body.SetAdminAclEntryEx_OUTPUT.ReturnValue !== 0) {
            throw new RPSError(`Failed to update AMT admin password for ${clientObj.uuid}`)
          }
          MqttProvider.publishEvent('success', ['updateAMTAdminPassword'], 'AMT admin Password updated', clientObj.uuid)
          clientObj.status.Status = 'AMT admin Password updated'
          return responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
        }
      }
      break
    }
    default: {
      clientObj.status.Status = 'Failed to update AMT admin password'
      return responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
    }
  }
}
