import { interpret } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import { devices } from '../WebSocketListener'
import { Maintenance, MaintenanceContext } from './maintenance'

describe('Maintenance State Machine', () => {
  let maintenance: Maintenance
  let wrapItSpy: jest.SpyInstance
  let config
  let context: MaintenanceContext
  let currentStateIndex = 0
  let responseMessageSpy: jest.SpyInstance
  let sendSpy: jest.SpyInstance
  let invokeSpy: jest.SpyInstance

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
    wrapItSpy = jest.spyOn(context.httpHandler, 'wrapIt').mockReturnValue('abcdef')
    responseMessageSpy = jest.spyOn(maintenance.responseMsg, 'get')
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
    invokeSpy = jest.spyOn(maintenance, 'invokeWsmanCall').mockResolvedValue(null)

    config = {
      services: {
        'get-low-accuracy-time-synch': Promise.resolve({ Envelope: { Body: { GetLowAccuracyTimeSynch_OUTPUT: { ReturnValue: 0 } } } }),
        'set-high-accuracy-time-synch': Promise.resolve({ Envelope: { Body: { SetHighAccuracyTimeSynch_OUTPUT: { ReturnValue: 0 } } } })
      },
      actions: {
        'Send Message to Device': () => {}
      }
    }
  })
  it('should syncclock', (done) => {
    const mockMaintenanceMachine = maintenance.machine.withConfig(config).withContext(context)
    const flowStates = ['PROVISIONED', 'GET_LOW_ACCURACY_TIME_SYNCH', 'SET_HIGH_ACCURACY_TIME_SYNCH', 'SUCCESS']

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
  it('should getLowAccuracyTimeSynch', async () => {
    await maintenance.getLowAccuracyTimeSynch(context)
    expect(invokeSpy).toHaveBeenCalled()
  })
  it('should setHighAccuracyTimeSynch', async () => {
    context.message = { Envelope: { Body: { GetLowAccuracyTimeSynch_OUTPUT: { Ta0: 0 } } } }
    await maintenance.setHighAccuracyTimeSynch(context)
    expect(invokeSpy).toHaveBeenCalled()
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
  it('invokeWsmanCall', async () => {
    invokeSpy.mockRestore()
    void maintenance.invokeWsmanCall(context)
    expect(responseMessageSpy).toHaveBeenCalled()
    expect(wrapItSpy).toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalled()
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
