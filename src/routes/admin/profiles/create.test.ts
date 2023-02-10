/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest'
import { Environment } from '../../../utils/Environment'
import { createProfile } from './create'
import { ClientAction, TlsMode, TlsSigningAuthority } from '../../../models/RCS.Config'
import { AMTUserConsent } from '../../../models'
import { adjustRedirectionConfiguration } from './common'

describe('Profiles - Create', () => {
  let resSpy
  let req
  let insertSpy: jest.SpyInstance
  let writeSecretSpy: jest.SpyInstance
  let defaultDbAmtCfgAcm
  let defaultRedirectionCfgACM
  let sparseAcmCfg

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { profiles: { insert: jest.fn(), delete: jest.fn() } },
      secretsManager: {
        writeSecretWithObject: jest.fn()
      },
      body: {},
      query: { }
    }
    defaultRedirectionCfgACM = {
      iderEnabled: false,
      kvmEnabled: true,
      solEnabled: false,
      userConsent: AMTUserConsent.KVM
    }
    defaultDbAmtCfgAcm = {
      amtPassword: 'AMT_PASSWORD',
      tenantId: undefined,
      ...defaultRedirectionCfgACM
    }
    sparseAcmCfg = {
      profileName: 'testProfile',
      activation: ClientAction.ADMINCTLMODE,
      dhcpEnabled: true,
      generateRandomPassword: false,
      amtPassword: 'P@ssw0rd',
      generateRandomMEBxPassword: false,
      mebxPassword: 'P@ssw0rd'
    }
    insertSpy = jest.spyOn(req.db.profiles, 'insert').mockResolvedValue({})
    writeSecretSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue({})
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
    Environment.Config = { VaultConfig: { SecretsPath: '' } } as any
  })
  it('should create', async () => {
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith(defaultDbAmtCfgAcm)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should handle error with create with write in vault fails', async () => {
    jest.spyOn(req.db.profiles, 'delete').mockResolvedValue(true)
    writeSecretSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue(null)
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith(defaultDbAmtCfgAcm)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should handle error with create with write in vault fails and undo db.delete fail', async () => {
    jest.spyOn(req.db.profiles, 'delete').mockResolvedValue(null)
    writeSecretSpy = jest.spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue(null)
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith(defaultDbAmtCfgAcm)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should create when generate random password false for acm', async () => {
    req.body = {
      profileName: 'acm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['acm'],
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
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
  it('should create when generate random password and generate MEBX password true for acm', async () => {
    req.body = {
      profileName: 'acm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['acm'],
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
      dhcpEnabled: false,
      generateRandomPassword: true,
      password: 'password',
      generateRandomMEBxPassword: true,
      mebxPassword: 'password',
      userConsent: AMTUserConsent.NONE,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    }
    await createProfile(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should create self signed certificate when selected as signing authority', async () => {
    req.body = {
      ...sparseAcmCfg,
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED
    }
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({
      ...req.body,
      amtPassword: 'AMT_PASSWORD',
      mebxPassword: 'MEBX_PASSWORD',
      ...defaultRedirectionCfgACM
    })
    expect(writeSecretSpy).toHaveBeenNthCalledWith(2, `TLS/${req.body.profileName}`, expect.anything())
  })
  it('should create self signed certificate by default', async () => {
    req.body = {
      ...sparseAcmCfg,
      tlsMode: TlsMode.SERVER_ALLOW_NONTLS
    }
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({
      ...req.body,
      amtPassword: 'AMT_PASSWORD',
      mebxPassword: 'MEBX_PASSWORD',
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED,
      ...defaultRedirectionCfgACM
    })
    expect(writeSecretSpy).toHaveBeenNthCalledWith(2, `TLS/${req.body.profileName}`, expect.anything())
  })
  it('should not create self signed certificate if tlsMode is falsy', async () => {
    req.body = {
      ...sparseAcmCfg,
      tlsSigningAuthority: TlsSigningAuthority.SELF_SIGNED
    }
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith({
      ...req.body,
      amtPassword: 'AMT_PASSWORD',
      mebxPassword: 'MEBX_PASSWORD',
      ...defaultRedirectionCfgACM
    })
    expect(writeSecretSpy).not.toHaveBeenNthCalledWith(2, `TLS/${req.body.profileName}`, expect.anything())
  })
  it(`should set default AMT Redirection Configuration settings for ${ClientAction.ADMINCTLMODE}`, async () => {
    req.body = {
      activation: ClientAction.ADMINCTLMODE
    }
    const result = adjustRedirectionConfiguration(req.body)
    expect(result).toEqual({
      ...req.body,
      ...defaultRedirectionCfgACM
    })
  })
  it(`should set default AMT Redirection Configuration settings for ${ClientAction.CLIENTCTLMODE}`, async () => {
    req.body = {
      activation: ClientAction.CLIENTCTLMODE
    }
    const result = adjustRedirectionConfiguration(req.body)
    expect(result).toEqual({
      ...req.body,
      ...defaultRedirectionCfgACM,
      userConsent: AMTUserConsent.ALL
    })
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.profiles, 'insert').mockResolvedValue(null)
    await createProfile(req, resSpy)
    expect(insertSpy).toHaveBeenCalledWith(defaultDbAmtCfgAcm)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should create even when no secretsManager', async () => {
    req.secretsManager = null
    await createProfile(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
})
