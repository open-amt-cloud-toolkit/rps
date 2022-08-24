import { FeaturesConfiguration } from './featuresConfiguration'
import { ClientAction } from '../models/RCS.Config'
import { AMTUserConsent } from '../models'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'

let clientId
let amtCfg

beforeAll(() => {
  clientId = uuid()
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
})
