import { FeaturesConfiguration } from './featuresConfiguration'
import { ClientAction } from '../models/RCS.Config'
import { AMTUserConsent } from '../models'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'

let clientId
let amtCfg

beforeAll(() => {
  clientId = uuid()
  devices[clientId] = {
    unauthCount: 0,
    ClientId: clientId,
    ClientSocket: { send: jest.fn() } as any,
    ClientData: {
      method: 'activation',
      apiKey: 'key',
      appVersion: '1.2.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: "all's good!",
      payload: {
        ver: '11.8.50',
        build: '3425',
        fqdn: 'vprodemo.com',
        password: 'KQGnH+N5qJ8YLqjEFJMnGSgcnFLMv0Tk',
        hostname: 'DESKTOP-9CC12U7',
        currentMode: 0,
        certHashes: [
          'e7685634efacf69ace939a6b255b7b4fabef42935b50a265acb5cb6027e44e70',
          'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244'
        ],
        sku: '16392',
        uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
        username: '$$OsAdmin',
        client: 'PPC',
        profile: 'profile1',
        action: ClientAction.ADMINCTLMODE
      }
    },
    ciraconfig: {},
    network: {},
    status: {},
    activationStatus: {},
    connectionParams: {
      guid: '4c4c4544-004b-4210-8033-b6c04f504633',
      port: 16992,
      digestChallenge: null,
      username: 'admin',
      password: 'P@ssw0rd'
    },
    uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
    messageId: 1
  }
  amtCfg = {
    profileName: 'acm',
    generateRandomPassword: false,
    activation: ClientAction.ADMINCTLMODE,
    ciraConfigName: 'config1',
    generateRandomMEBxPassword: false,
    userConsent: AMTUserConsent.ALL,
    solEnabled: true,
    iderEnabled: false,
    kvmEnabled: true
  }
})

it('should work for the happy path', () => {
  const featCfg = new FeaturesConfiguration(clientId, amtCfg)
  expect(featCfg.machine.id).toEqual('features-configuration-fsm')
  featCfg.service.start()
})
