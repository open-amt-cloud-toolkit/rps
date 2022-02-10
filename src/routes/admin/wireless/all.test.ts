import { createSpyObj } from '../../../test/helper/jest'
import { allProfiles } from './all'

describe('Wireless - All', () => {
  let resSpy
  let req
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { wirelessProfiles: { get: jest.fn() } },
      query: { }
    }
    jest.spyOn(req.db.wirelessProfiles, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should get all', async () => {
    await allProfiles(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
})
