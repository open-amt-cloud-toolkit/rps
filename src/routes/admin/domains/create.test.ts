import { createSpyObj } from '../../../test/helper/jest'
import { createDomain } from './create'

describe('Domain - Create', () => {
  let resSpy
  let req
  let insertSpy: jest.SpyInstance
  let secretManagerSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { domains: { insert: jest.fn(), delete: jest.fn() } },
      secretsManager: {
        writeSecretWithObject: jest.fn()
      },
      body: { },
      query: { }
    }
    insertSpy = jest.spyOn(req.db.domains, 'insert').mockResolvedValue({ })
    secretManagerSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue({ })
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should create', async () => {
    await createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(secretManagerSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should handle error with create with write in vault fails', async () => {
    jest.spyOn(req.db.domains, 'delete').mockResolvedValue(true)
    secretManagerSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue(null)
    await createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(secretManagerSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should handle error with create with write in vault fails and undo db.delete fail', async () => {
    jest.spyOn(req.db.domains, 'delete').mockResolvedValue(null)
    secretManagerSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue(null)
    await createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(secretManagerSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.domains, 'insert').mockResolvedValue(null)
    await createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should create even when no secretsManager', async () => {
    req.secretsManager = null
    await createDomain(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
})
