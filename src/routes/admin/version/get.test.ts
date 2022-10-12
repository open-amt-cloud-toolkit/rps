import { createSpyObj } from '../../../test/helper/jest'
import * as version from './get'

describe('Checks getVersion', () => {
  let resSpy
  let req
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
    req = {
      serviceVersion: '2.5.0',
      protocolVersion: '4.0.0'
    }
  })
  it('should return with protocolVersion and serviceVersion', async () => {
    await version.getVersion(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
    expect(resSpy.json).toHaveBeenCalledWith({ serviceVersion: '2.5.0', protocolVersion: '4.0.0' })
  })
})
