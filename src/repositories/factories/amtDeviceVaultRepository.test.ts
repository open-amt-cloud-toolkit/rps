import { config } from '../../test/helper/Config'
import { Configurator } from '../../Configurator'
import { EnvReader } from '../../utils/EnvReader'
import { ILogger } from '../../interfaces/ILogger'
import Logger from '../../Logger'
import { AMTDeviceDTO } from '../../models'
import { AMTDeviceVaultRepository } from './AMTDeviceVaultRepository'
import { randomUUID } from 'crypto'
import { AMTUserName } from '../../utils/constants'

EnvReader.GlobalEnvConfig = config
let device: AMTDeviceDTO
const logger: ILogger = new Logger('AMTDeviceVaultRepositoryTest')
let configurator: Configurator
let devVaultRepo: AMTDeviceVaultRepository
beforeEach(() => {
  configurator = new Configurator()
  devVaultRepo = new AMTDeviceVaultRepository(logger, configurator)
  const uuid = randomUUID()
  device = {
    guid: uuid,
    name: uuid,
    mpsuser: null,
    mpspass: 'shh-sekrit-mps',
    amtuser: AMTUserName,
    amtpass: 'shh-sekrit-amt',
    mebxpass: 'shh-sekrit-mebx'
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('insert', () => {
  it('should succeed', async () => {
    jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockResolvedValue(undefined)
    expect(await devVaultRepo.insert(device)).toBeTruthy()
  })
  it('should catch secret manager error and throw', async () => {
    jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockRejectedValue(new Error('haha, rejected!'))
    await expect(devVaultRepo.insert(device))
      .rejects
      .toThrow()
  })
})

describe('get', () => {
  it('should succeed', async () => {
    jest.spyOn(configurator.secretsManager, 'getSecretAtPath').mockResolvedValue(
      {
        data: {
          AMT_PASSWORD: device.amtpass,
          MEBX_PASSWORD: device.mebxpass,
          MPS_PASSWORD: device.mpspass
        }
      }
    )
    expect(await devVaultRepo.get(device.guid)).toEqual(device)
  })
  it('should throw error on invalid secret manager response', async () => {
    jest.spyOn(configurator.secretsManager, 'getSecretAtPath').mockResolvedValue(null)
    await expect(devVaultRepo.get(device.guid))
      .rejects
      .toThrow()
  })
  it('should catch secret manager error and throw', async () => {
    jest.spyOn(configurator.secretsManager, 'getSecretAtPath').mockRejectedValue(new Error('haha, rejected!'))
    await expect(devVaultRepo.get(device.guid))
      .rejects
      .toThrow()
  })
})

describe('delete', () => {
  it('should succeed', async () => {
    jest.spyOn(configurator.secretsManager, 'deleteSecretWithPath').mockResolvedValue(undefined)
    expect(await devVaultRepo.delete(device.guid)).toBeTruthy()
  })
  it('should catch secret manager error and throw', async () => {
    jest.spyOn(configurator.secretsManager, 'deleteSecretWithPath').mockRejectedValue(new Error('haha, rejected!'))
    await expect(devVaultRepo.delete(device.guid))
      .rejects
      .toThrow()
  })
})
