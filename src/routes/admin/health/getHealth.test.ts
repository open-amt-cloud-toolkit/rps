import { createSpyObj } from '../../../test/helper/jest'
import { EnvReader } from '../../../utils/EnvReader'
import { MqttProvider } from '../../../utils/MqttProvider'
import { getHealthCheck } from './getHealth'
import { config } from '../../../test/helper/Config'

describe('Checks health of dependent services', () => {
  let resSpy
  let req
  let mqttSpy: jest.SpyInstance
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      rpsService: {
        secrets: createSpyObj('SecretProvider', ['health'])
      },
      db: createSpyObj('DB', ['query'])
    }
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
    mqttSpy = jest.spyOn(MqttProvider, 'publishEvent')
  })
  it('should handle health check failed', async () => {
    await getHealthCheck(null, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(500)
    expect(mqttSpy).toHaveBeenCalled()
  })
  it('should be healthy when database is ready', async () => {
    EnvReader.GlobalEnvConfig = config
    await getHealthCheck(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should not be healthy when db error', async () => {
    req.db.query.mockRejectedValue({ code: '28P01' })
    await getHealthCheck(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(503)
  })
})
