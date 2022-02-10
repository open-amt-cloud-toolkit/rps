import { createSpyObj } from '../../../test/helper/jest'
import { getWirelessProfile } from './get'

describe('Wireless - Get', () => {
  let resSpy
  let req
  let getByNameSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { wirelessProfiles: { getByName: jest.fn() } },
      query: { },
      params: { profileName: 'profileName' }
    }
    getByNameSpy = jest.spyOn(req.db.wirelessProfiles, 'getByName').mockResolvedValue({})

    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should get', async () => {
    await getWirelessProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName')
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.wirelessProfiles, 'getByName').mockRejectedValue(null)
    await getWirelessProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName')
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
