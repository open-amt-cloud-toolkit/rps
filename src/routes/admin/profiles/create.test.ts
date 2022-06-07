import { createSpyObj } from '../../../test/helper/jest'
import { EnvReader } from '../../../utils/EnvReader'
import { createProfile, generateSelfSignedCertificate, setRedirectionConfiguration } from './create'
import { ClientAction } from '../../../models/RCS.Config'
import { AMTUserConsent } from '../../../models'

describe('Profiles - Create', () => {
  let resSpy
  let req
  let insertSpy: jest.SpyInstance
  let secretManagerSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { profiles: { insert: jest.fn() } },
      secretsManager: {
        writeSecretWithObject: jest.fn()
      },
      body: {},
      query: { }
    }
    insertSpy = jest.spyOn(req.db.profiles, 'insert').mockResolvedValue({})
    secretManagerSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue({})
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
    EnvReader.GlobalEnvConfig = { VaultConfig: { SecretsPath: '' } } as any
  })
  it('should create', async () => {
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({
      amtPassword: 'AMT_PASSWORD',
      iderEnabled: false,
      kvmEnabled: true,
      solEnabled: false,
      userConsent: AMTUserConsent.KVM,
      tenantId: undefined
    })
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should create when generate random password false for acm', async () => {
    req.body = {
      profileName: 'acm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['acm'],
      tlsMode: 2,
      dhcpEnabled: false,
      generateRandomPassword: false,
      password: 'password',
      generateRandomMEBxPassword: false,
      mebxPassword: 'password',
      userConsent: AMTUserConsent.NONE,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    }
    await createProfile(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should create self signed certificate', async () => {
    req.body = {
      profileName: 'ccm',
      activation: ClientAction.CLIENTCTLMODE,
      tags: ['ccm'],
      dhcpEnabled: false,
      generateRandomPassword: false,
      password: 'P@ssw0rd',
      generateRandomMEBxPassword: false,
      mebxPassword: 'P@ssw0rd',
      tlsmode: 2,
      userConsent: 'None',
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    }
    await generateSelfSignedCertificate(req, req.body.profileName)
    expect(secretManagerSpy).toHaveBeenCalled()
  })
  it(`should set default AMT Redirection Configuration settings for ${ClientAction.ADMINCTLMODE}`, async () => {
    req.body = {
      profileName: 'ccm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['ccm'],
      dhcpEnabled: false,
      generateRandomPassword: false,
      password: 'P@ssw0rd',
      generateRandomMEBxPassword: false,
      mebxPassword: 'P@ssw0rd',
      tlsmode: 2
    }
    const result = setRedirectionConfiguration(req.body)
    expect(result.userConsent).toEqual(AMTUserConsent.KVM)
    expect(result.iderEnabled).toEqual(false)
    expect(result.kvmEnabled).toEqual(true)
    expect(result.solEnabled).toEqual(false)
  })
  it(`should set default AMT Redirection Configuration settings for ${ClientAction.CLIENTCTLMODE}`, async () => {
    req.body = {
      profileName: 'ccm',
      activation: ClientAction.CLIENTCTLMODE,
      tags: ['ccm'],
      dhcpEnabled: false,
      generateRandomPassword: false,
      password: 'P@ssw0rd',
      generateRandomMEBxPassword: false,
      mebxPassword: 'P@ssw0rd',
      tlsmode: 2
    }
    const result = setRedirectionConfiguration(req.body)
    expect(result.userConsent).toEqual(AMTUserConsent.ALL)
    expect(result.iderEnabled).toEqual(false)
    expect(result.kvmEnabled).toEqual(true)
    expect(result.solEnabled).toEqual(false)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.profiles, 'insert').mockRejectedValue(null)
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({
      amtPassword: 'AMT_PASSWORD',
      iderEnabled: false,
      kvmEnabled: true,
      solEnabled: false,
      userConsent: 'KVM',
      tenantId: undefined
    })
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
