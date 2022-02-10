import { createSpyObj } from '../../../test/helper/jest'
import { allProfiles } from './all'

describe('Profiles - All', () => {
  let resSpy
  let req
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { profiles: { get: jest.fn() } },
      query: { }
    }
    jest.spyOn(req.db.profiles, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should get all', async () => {
    await allProfiles(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
})
