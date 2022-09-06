import { passwordChecker, domainSuffixChecker, expirationChecker } from './domain'
import { NodeForge } from '../../../NodeForge'
import { CertManager } from '../../../certManager'
import Logger from '../../../Logger'

describe('Domain Profile Validation', () => {
  const nodeForge = new NodeForge()
  const certManager = new CertManager(new Logger('CertManager'), nodeForge)
  let req
  let pfxobj
  let value

  test('passwordChecker - success', () => {
    req = { body: { provisioningCert: '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', provisioningCertPassword: 'Intel123!' } }
    pfxobj = passwordChecker(certManager, req)
    expect(() => {
      passwordChecker(certManager, req)
    }).not.toThrowError(new Error('Unable to decrypt provisioning certificate. Please check that the password is correct, and that the certificate is a valid certificate.'))
  })

  test('passwordChecker - failure', () => {
    req = { body: { provisioningCert: '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', provisioningCertPassword: 'Wrong123!' } }
    expect(() => {
      passwordChecker(certManager, req)
    }).toThrowError(new Error('Unable to decrypt provisioning certificate. Please check that the password is correct, and that the certificate is a valid certificate.'))
  })

  test('domainSuffixChecker - success', () => {
    value = 'test.com'
    expect(() => {
      domainSuffixChecker(pfxobj, value)
    }).not.toThrowError(new Error('FQDN not associated with provisioning certificate'))
  })

  test('domainSuffixChecker - failure', () => {
    value = 'wrong.com'
    expect(() => {
      domainSuffixChecker(pfxobj, value)
    }).toThrowError(new Error('FQDN not associated with provisioning certificate'))
  })

  test('expirationChecker - success', () => {
    expect(() => {
      expirationChecker(pfxobj)
    }).not.toThrowError(new Error('Uploaded certificate has expired'))
  })

  test('expirationChecker - failure', () => {
    pfxobj.certs[0].validity.notAfter = new Date(1478708162000)
    expect(() => {
      expirationChecker(pfxobj)
    }).toThrowError(new Error('Uploaded certificate has expired'))
  })
})
