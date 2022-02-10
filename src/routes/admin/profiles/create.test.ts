import { createSpyObj } from '../../../test/helper/jest'
import { EnvReader } from '../../../utils/EnvReader'
import { createProfile } from './create'

describe('Profiles - Create', () => {
  let resSpy
  let req
  let insertSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { profiles: { insert: jest.fn() } },
      secretsManager: {
        writeSecretWithObject: jest.fn()
      },
      body: {},
      query: { }
    }
    insertSpy = jest.spyOn(req.db.profiles, 'insert').mockResolvedValue({})
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
    EnvReader.GlobalEnvConfig = { VaultConfig: { SecretsPath: '' } } as any
  })
  it('should create', async () => {
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({
      amtPassword: 'AMT_PASSWORD',
      tenantId: undefined
    })
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.profiles, 'insert').mockRejectedValue(null)
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({
      amtPassword: 'AMT_PASSWORD',
      tenantId: undefined
    })
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
