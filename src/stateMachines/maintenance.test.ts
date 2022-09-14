import { interpret } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import ClientResponseMsg from '../utils/ClientResponseMsg'
import { devices } from '../WebSocketListener'
import { Maintenance, MaintenanceContext } from './maintenance'

describe('Maintenance State Machine', () => {
  let maintenance: Maintenance
  let config
  let context: MaintenanceContext
  let currentStateIndex = 0
  let responseMessageSpy: jest.SpyInstance
  let sendSpy: jest.SpyInstance

  const clientId = '4c4c4544-004b-4210-8033-b6c04f504633'
  beforeEach(() => {
    currentStateIndex = 0
    devices[clientId] = {
      status: {},
      ClientSocket: { send: jest.fn() }
    } as any
    context = {
      clientId,
      httpHandler: new HttpHandler(),
      message: null,
      xmlMessage: '',
      errorMessage: '',
      statusMessage: '',
      status: 'success'
    }
    maintenance = new Maintenance()
    responseMessageSpy = jest.spyOn(ClientResponseMsg, 'get')
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()

    config = {
      services: {
        'time-machine': Promise.resolve(true),
        'error-machine': Promise.resolve(true)

      },
      actions: {
        'Send Message to Device': () => {}
      }
    }
  })

  it('should syncclock', (done) => {
    const mockMaintenanceMachine = maintenance.machine.withConfig(config).withContext(context)
    const flowStates = ['PROVISIONED', 'SYNC_TIME', 'SUCCESS']

    const maintenanceService = interpret(mockMaintenanceMachine).onTransition((state) => {
      console.log(state.value)
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    maintenanceService.start()
    maintenanceService.send({ type: 'SYNCCLOCK', clientId })
  })

  it('should update configuration status when success', () => {
    context.statusMessage = 'test'
    context.status = 'success'
    maintenance.updateConfigurationStatus(context)
    expect(devices[context.clientId].status.Status).toBe('test')
  })

  it('should update configuration status when error', () => {
    context.errorMessage = 'test2'
    context.status = 'error'
    maintenance.updateConfigurationStatus(context)
    expect(devices[context.clientId].status.Status).toBe('test2')
  })

  it('should send message to device when success', () => {
    maintenance.sendMessageToDevice(context, { data: '' })
    expect(responseMessageSpy).toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalled()
  })

  it('should send message to device when error', () => {
    context.status = 'error'
    maintenance.sendMessageToDevice(context, { data: '' })
    expect(responseMessageSpy).toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalled()
  })
})
