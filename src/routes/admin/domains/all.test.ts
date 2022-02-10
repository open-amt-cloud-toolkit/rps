import { createSpyObj } from '../../../test/helper/jest'
import { getAllDomains } from './all'

describe('Domains - All', () => {
  let resSpy
  let req
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { domains: { get: jest.fn() } },
      query: { }
    }
    jest.spyOn(req.db.domains, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should get all', async () => {
    await getAllDomains(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
})
