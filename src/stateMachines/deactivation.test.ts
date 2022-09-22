import { interpret } from 'xstate'
import { Deactivation, DeactivationContext } from './deactivation'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { config } from '../test/helper/Config'
import { EnvReader } from '../utils/EnvReader'
import ClientResponseMsg from '../utils/ClientResponseMsg'

const clientId = uuid()
EnvReader.GlobalEnvConfig = config

describe('Deactivation State Machine', () => {
  let deactivation: Deactivation
  let deactivationContext: DeactivationContext
  let config
  let currentStateIndex: number
  let wrapItSpy: jest.SpyInstance
  let setupAndConfigurationServiceSpy: jest.SpyInstance
  let sendSpy: jest.SpyInstance
  let responseMessageSpy: jest.SpyInstance
  beforeEach(() => {
    deactivation = new Deactivation()
    wrapItSpy = jest.spyOn(deactivation.httpHandler, 'wrapIt').mockReturnValue('abcdef')
    setupAndConfigurationServiceSpy = jest.spyOn(deactivation.amt, 'SetupAndConfigurationService').mockImplementation().mockReturnValue('abcdef')
    responseMessageSpy = jest.spyOn(ClientResponseMsg, 'get').mockReturnValue({} as any)
    devices[clientId] = {
      unauthCount: 0,
      ClientId: clientId,
      ClientSocket: { send: jest.fn() } as any,
      ClientData: '',
      ciraconfig: {},
      network: {},
      status: {},
      activationStatus: {},
      connectionParams: {
        guid: '4c4c4544-004b-4210-8033-b6c04f504633',
        port: 16992,
        digestChallenge: null,
        username: 'admin',
        password: 'P@ssw0rd'
      },
      uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
      messageId: 1
    }
    deactivationContext = { message: '', clientId: '', status: '', unauthCount: 0, errorMessage: '' }
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockImplementation().mockReturnValue()
    currentStateIndex = 0
    config = {
      services: {
        'send-unprovision-message': Promise.resolve(clientId),
        'remove-device-from-secret-provider': Promise.resolve(true),
        'remove-device-from-mps': Promise.resolve(true),
        'error-machine': Promise.resolve(clientId)
      },
      actions: {
        'Send Message to Device': () => {}
      }
    }
  })

  it('should eventually reach "UNPROVISIONED"', (done) => {
    const mockDeactivationMachine = deactivation.machine.withConfig(config).withContext(deactivationContext)
    const flowStates = [
      'PROVISIONED',
      'UNPROVISIONING',
      'REMOVE_DEVICE_FROM_SECRET_PROVIDER',
      'REMOVE_DEVICE_FROM_MPS',
      'UNPROVISIONED'
    ]
    const deactivationService = interpret(mockDeactivationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('UNPROVISIONED') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    deactivationService.start()
    deactivationService.send({ type: 'UNPROVISION', clientId, data: null })
  })
  it('should eventually reach "UNPROVISIONED" when service provider gives not found error', (done) => {
    config.services['remove-device-from-secret-provider'] = Promise.reject(new Error('HTTPError: Response code 404 (Not Found)'))
    config.services['remove-device-from-mps'] = Promise.resolve(true)
    const mockDeactivationMachine = deactivation.machine.withConfig(config).withContext(deactivationContext)
    const flowStates = [
      'PROVISIONED',
      'UNPROVISIONING',
      'REMOVE_DEVICE_FROM_SECRET_PROVIDER',
      'REMOVE_DEVICE_FROM_MPS',
      'UNPROVISIONED'
    ]
    const deactivationService = interpret(mockDeactivationMachine).onTransition((state) => {
      console.log(state.value)
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('UNPROVISIONED') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    deactivationService.start()
    deactivationService.send({ type: 'UNPROVISION', clientId, data: null })
  })
  it('should eventually reach "Failed"', (done) => {
    config.services['send-unprovision-message'] = Promise.reject(new Error())
    config.services['error-machine'] = async (_, event) => await new Promise((resolve, reject) => {
      setTimeout(() => {
        deactivationService.send({ type: 'ONFAILED', clientId, data: null })
        reject(new Error())
      }, 50)
    })
    const mockDeactivationMachine = deactivation.machine.withConfig(config)
    const flowStates = ['PROVISIONED', 'UNPROVISIONING', 'ERROR', 'FAILED']
    const deactivationService = interpret(mockDeactivationMachine).onTransition((state) => {
    // assert that effects were executed
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    deactivationService.start()
    deactivationService.send({ type: 'UNPROVISION', clientId, data: null })
  })

  it('should invoke unprovision and return promise', async () => {
    const context: DeactivationContext = {
      message: '',
      clientId,
      unauthCount: 0,
      status: '',
      errorMessage: ''
    }

    void deactivation.invokeUnprovision(context)
    expect(devices[clientId].pendingPromise).toBeDefined()
    expect(wrapItSpy).toHaveBeenCalled()
    expect(setupAndConfigurationServiceSpy).toHaveBeenCalled()
  })

  it('should send success message to device', () => {
    const context: DeactivationContext = {
      message: '',
      clientId,
      unauthCount: 0,
      status: 'success',
      errorMessage: ''
    }
    deactivation.sendMessageToDevice(context, null)
    expect(responseMessageSpy).toHaveBeenCalledWith(context.clientId, null, context.status, 'success', JSON.stringify(devices[clientId].status))
    expect(sendSpy).toHaveBeenCalled()
  })

  it('should send error message to device', () => {
    const context: DeactivationContext = {
      message: '',
      clientId,
      unauthCount: 0,
      status: 'error',
      errorMessage: ''
    }
    deactivation.sendMessageToDevice(context, null)
    expect(responseMessageSpy).toHaveBeenCalledWith(context.clientId, null, context.status, 'failed', JSON.stringify(devices[clientId].status))
    expect(sendSpy).toHaveBeenCalled()
  })

  it('should eventually reach "PROVISIONED"', (done) => {
    const service = interpret(deactivation.machine).onTransition((state) => {
      if (state.matches('PROVISIONED')) {
        expect(state.matches('PROVISIONED')).toBe(true)
        done()
      }
    })
    service.start()
    service.send({ type: 'UNPROVISION', clientId, data: null })
  })
})
