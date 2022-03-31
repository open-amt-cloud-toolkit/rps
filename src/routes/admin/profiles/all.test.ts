import { createSpyObj } from '../../../test/helper/jest'
import { allProfiles } from './all'

describe('Profiles - All', () => {
  let resSpy
  let req
  let getSpy: jest.SpyInstance
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: {
        profiles: { get: jest.fn() }
      },
      query: { }
    }
    getSpy = jest.spyOn(req.db.profiles, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })

  it('should get all', async () => {
    await allProfiles(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should get all with req.query.$count as true', async () => {
    req.db.profiles.getCount = jest.fn().mockImplementation().mockResolvedValue(123)
    req.query.$count = true
    await allProfiles(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(req.db.profiles.getCount).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should set status to 500 if error occurs', async () => {
    req.db.profiles.getCount = jest.fn().mockImplementation(() => {
      throw new TypeError('fake error')
    })
    req.query.$count = true
    await allProfiles(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(req.db.profiles.getCount).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
