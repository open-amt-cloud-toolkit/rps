import { createSpyObj } from '../../../test/helper/jest'
import * as version from './get'
import { ServiceVersion, ProtocolVersion } from '../../../utils/constants'

describe('Checks getVersion', () => {
  let resSpy
  let req
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should return with protocolVersion and serviceVersion', async () => {
    await version.getVersion(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
    expect(resSpy.json).toHaveBeenCalledWith({ serviceVersion: ServiceVersion, protocolVersion: ProtocolVersion })
  })
})
