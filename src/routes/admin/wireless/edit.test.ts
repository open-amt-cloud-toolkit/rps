import { createSpyObj } from '../../../test/helper/jest'
import { editWirelessProfile } from './edit'

describe('Wireless - Edit', () => {
  let resSpy
  let req
  let getByNameSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { wirelessProfiles: { getByName: jest.fn(), update: jest.fn() } },
      body: { profileName: 'profileName' },
      query: { }
    }
    getByNameSpy = jest.spyOn(req.db.wirelessProfiles, 'getByName').mockResolvedValue({})
    jest.spyOn(req.db.wirelessProfiles, 'update').mockResolvedValue({})

    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should edit', async () => {
    await editWirelessProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName')
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should handle not found', async () => {
    jest.spyOn(req.db.wirelessProfiles, 'getByName').mockResolvedValue(null)
    await editWirelessProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName')
    expect(resSpy.status).toHaveBeenCalledWith(404)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.wirelessProfiles, 'getByName').mockRejectedValue(null)
    await editWirelessProfile(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName')
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
