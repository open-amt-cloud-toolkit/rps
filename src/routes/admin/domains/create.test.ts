import { createSpyObj } from '../../../test/helper/jest'
import { createDomain } from './create'

describe('CIRA Config - Create', () => {
  let resSpy
  let req
  let insertSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { domains: { insert: jest.fn() } },
      body: {},
      query: { }
    }
    insertSpy = jest.spyOn(req.db.domains, 'insert').mockResolvedValue({})
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should create', async () => {
    await createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({})
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.domains, 'insert').mockRejectedValue(null)
    await createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({})
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
