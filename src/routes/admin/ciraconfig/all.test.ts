import { createSpyObj } from '../../../test/helper/jest'
import { allCiraConfigs } from './all'

describe('CIRA Config - All', () => {
  let resSpy
  let req
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { ciraConfigs: { get: jest.fn() } },
      query: { }
    }
    jest.spyOn(req.db.ciraConfigs, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should get all', async () => {
    await allCiraConfigs(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
})
