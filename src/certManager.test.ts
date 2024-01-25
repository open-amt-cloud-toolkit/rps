/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CertManager } from './certManager.js'
import { NodeForge } from './NodeForge.js'
import { type AMTKeyUsage, type CertAttributes, type CertificateObject } from './models/index.js'
import Logger from './Logger.js'
import { TEST_PFXCERT, EXPECTED_CERT } from './test/helper/certs.js'
import { spyOn } from 'jest-mock'

describe('certManager tests', () => {
  describe('sortCertificate tests', () => {
    test('issuer is from root', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)

      const certificateObject1: CertificateObject = {
        issuer: 'issuer',
        pem: 'pem1',
        subject: 'subject1'
      }
      const certificateObject2: CertificateObject = {
        issuer: 'issuer2',
        pem: 'pem2',
        subject: 'issuer'
      }
      const result = certManager.sortCertificate(certificateObject1, certificateObject2)
      expect(result).toEqual(true)
    })

    test('issuer is not from root', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)

      const certificateObject1: CertificateObject = {
        issuer: 'issuer',
        pem: 'pem',
        subject: 'subject1'
      }

      const certificateObject2: CertificateObject = {
        issuer: 'issuer',
        pem: 'pem',
        subject: 'issuer2'
      }
      const result = certManager.sortCertificate(certificateObject1, certificateObject2)
      expect(result).toEqual(false)
    })
  })

  describe('convertPfxToObject tests', () => {
    test('Extracts the provisioning certificate', () => {
      const pfxb64: string = TEST_PFXCERT

      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)

      // convert the certificate pfx to an object
      const pfxobj = certManager.convertPfxToObject(pfxb64, 'P@ssw0rd')

      expect(pfxobj.certs).toHaveLength(2)
      expect(pfxobj.keys).toHaveLength(1)
    })
  })

  describe('dumpPfx tests', () => {
    test('Pulls the provisioning certificate apart and exports each PEM', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)
      const pfxObj = certManager.convertPfxToObject(TEST_PFXCERT, 'P@ssw0rd')
      const certChainPfx = certManager.dumpPfx(pfxObj)

      expect(certChainPfx.provisioningCertificateObj.certChain).toEqual(EXPECTED_CERT.provisioningCertificateObj.certChain)
      expect(certChainPfx.fingerprint).toEqual(EXPECTED_CERT.fingerprint)
      expect(certChainPfx.hashAlgorithm).toEqual(EXPECTED_CERT.hashAlgorithm)
      expect(certChainPfx.provisioningCertificateObj).toHaveProperty('privateKey')
      expect(certChainPfx.provisioningCertificateObj.privateKey).toBeDefined()
    })
  })

  describe('createCertificate tests', () => {
    test('should generate leaf certificate with console enabled', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)
      const keyUsage: AMTKeyUsage = {
        /** Extension ID  */
        name: 'extKeyUsage',
        /** Enables Console Usage */
        '2.16.840.1.113741.1.2.1': true,
        /** Enables Agent Usage */
        '2.16.840.1.113741.1.2.2': false,
        /** Enables AMT Activation Usage */
        '2.16.840.1.113741.1.2.3': false,
        /** Enables TLS Usage on the Server */
        serverAuth: false,
        /** Enables TLS Usage Usage on the Client */
        clientAuth: false,
        /** Enables Email Protection */
        emailProtection: false,
        /** Enables Code Signing */
        codeSigning: false,
        /** Enables Time Stamping */
        timeStamping: false
      }
      const certAttr: CertAttributes = {
        CN: 'commonName',
        C: 'country',
        ST: 'stateOrProvince',
        O: 'organization'
      }
      const leafSpy = spyOn(certManager, 'generateLeafCertificate')

      const rootCert = certManager.createCertificate(certAttr)
      const leafCert = certManager.createCertificate(certAttr, rootCert.key, null, certAttr, keyUsage)
      expect(leafCert).toBeDefined()
      expect(leafSpy).toHaveBeenCalled()
      expect(leafCert.cert.serialNumber).toBeDefined()
      expect(leafCert.cert.publicKey).toBeDefined()
      expect(leafCert.cert.validity.notBefore).toEqual(new Date(2018, 0, 1))
      expect(leafCert.cert.validity.notAfter).toEqual(new Date(2049, 11, 31))
      expect(leafCert.cert.extensions.length).toEqual(5)
      expect(leafCert.cert.extensions[0].name).toEqual('basicConstraints')
      expect(leafCert.cert.extensions[1].name).toEqual('keyUsage')
      expect(leafCert.cert.extensions[1].keyCertSign).toBe(true)
      expect(leafCert.cert.extensions[1].digitalSignature).toBe(true)
      expect(leafCert.cert.extensions[1].nonRepudiation).toBe(true)
      expect(leafCert.cert.extensions[1].keyEncipherment).toBe(true)
      expect(leafCert.cert.extensions[1].dataEncipherment).toBe(true)
      expect(leafCert.cert.extensions[2].name).toEqual('extKeyUsage')
      expect(leafCert.cert.extensions[2]['2.16.840.1.113741.1.2.1']).toBe(true)
      expect(leafCert.cert.extensions[2]['2.16.840.1.113741.1.2.2']).toBe(false)
      expect(leafCert.cert.extensions[2]['2.16.840.1.113741.1.2.3']).toBe(false)
      expect(leafCert.cert.extensions[2].serverAuth).toBe(false)
      expect(leafCert.cert.extensions[2].clientAuth).toBe(true)
      expect(leafCert.cert.extensions[2].emailProtection).toBe(false)
      expect(leafCert.cert.extensions[2].codeSigning).toBe(false)
      expect(leafCert.cert.extensions[2].timeStamping).toBe(false)
      expect(leafCert.cert.extensions[3].name).toEqual('nsCertType')
      expect(leafCert.cert.extensions[3].client).toBe(true)
      expect(leafCert.cert.extensions[3].server).toBe(false)
      expect(leafCert.cert.extensions[3].email).toBe(false)
      expect(leafCert.cert.extensions[3].objsign).toBe(false)
      expect(leafCert.cert.extensions[4].name).toEqual('subjectKeyIdentifier')
      expect(leafCert.cert.issuer.attributes.length).toEqual(4)
      expect(leafCert.cert.issuer.attributes[0].value).toEqual(certAttr.CN)
      expect(leafCert.cert.issuer.attributes[1].value).toEqual(certAttr.C)
      expect(leafCert.cert.issuer.attributes[2].value).toEqual(certAttr.ST)
      expect(leafCert.cert.issuer.attributes[3].value).toEqual(certAttr.O)
      expect(leafCert.cert.subject.attributes.length).toEqual(4)
      expect(leafCert.cert.subject.attributes[0].value).toEqual(certAttr.CN)
      expect(leafCert.cert.subject.attributes[1].value).toEqual(certAttr.C)
      expect(leafCert.cert.subject.attributes[2].value).toEqual(certAttr.ST)
      expect(leafCert.cert.subject.attributes[3].value).toEqual(certAttr.O)
    })

    test('should generate root certificate', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)
      const rootSpy = spyOn(certManager, 'generateRootCertificate')
      const certAttr: CertAttributes = {
        CN: 'commonName',
        C: 'country',
        ST: 'stateOrProvince',
        O: 'organization'
      }
      const rootCert = certManager.createCertificate(certAttr)
      expect(rootSpy).toHaveBeenCalled()
      expect(rootCert).toBeDefined()
      expect(rootCert.cert.serialNumber).toBeDefined()
      expect(rootCert.cert.publicKey).toBeDefined()
      expect(rootCert.cert.validity.notBefore).toEqual(new Date(2018, 0, 1))
      expect(rootCert.cert.validity.notAfter).toEqual(new Date(2049, 11, 31))
      expect(rootCert.cert.issuer.attributes.length).toEqual(4)
      expect(rootCert.cert.issuer.attributes[0].value).toEqual(certAttr.CN)
      expect(rootCert.cert.issuer.attributes[1].value).toEqual(certAttr.C)
      expect(rootCert.cert.issuer.attributes[2].value).toEqual(certAttr.ST)
      expect(rootCert.cert.issuer.attributes[3].value).toEqual(certAttr.O)
      expect(rootCert.cert.subject.attributes[0].value).toEqual(certAttr.CN)
      expect(rootCert.cert.subject.attributes[1].value).toEqual(certAttr.C)
      expect(rootCert.cert.subject.attributes[2].value).toEqual(certAttr.ST)
      expect(rootCert.cert.subject.attributes[3].value).toEqual(certAttr.O)
      expect(rootCert.cert.extensions.length).toEqual(3)
      expect(rootCert.cert.extensions[0].name).toEqual('basicConstraints')
      expect(rootCert.cert.extensions[0].cA).toBe(true)
      expect(rootCert.cert.extensions[1].name).toBe('nsCertType')
      expect(rootCert.cert.extensions[1].sslCA).toBe(true)
      expect(rootCert.cert.extensions[1].emailCA).toBe(true)
      expect(rootCert.cert.extensions[1].objCA).toBe(true)
      expect(rootCert.cert.extensions[2].name).toEqual('subjectKeyIdentifier')
    })
  })

  describe('amtCertSignWithCAKey tests', () => {
    test('should sign AMT Cert with CA Key', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)
      const keys = nodeForge.rsaGenerateKeyPair(2048)
      const createCertificateSpy = spyOn(certManager, 'createCertificate')
      const generateLeafCertificateSpy = spyOn(certManager, 'generateLeafCertificate')

      const certAttr: CertAttributes = { CN: 'AMT', O: 'None', ST: 'None', C: 'None' }
      const issuerAttr: CertAttributes = { CN: 'Untrusted Root Certificate' }
      const extKeyUsage: AMTKeyUsage = { name: 'extKeyUsage', serverAuth: true } as any
      const derkey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw51PMBm2psyIjHPU1efH
      Ulyh22zy3hEhlsNPH6/Cqg0HJorX1WbNKLfiU2aAt24jn4CC+y8PusrmMMCIca5x
      0L4XZxm14QvKKImIOMOMblS1Te29n64HuuQ9owKLHuSMww4wiLiY/nAvjK/5/kKT
      HL6x7nK/Pq72eoQ/etFBkaX5nYGUD/+G+5BgAPx1mBgU5/y9+/+QZ9xbYU6zogOW
      Tfa6rDMSAbmJOtkk1ghnuaq4dSoHWbW+zpHMVtjtHgzDGhX9KjOmvSDQIGn4wevD
      p2yDLULUbsdO4ylacTkxyIc92ZHdZeP6Hh+KhNC04Z65zwXLEA3M4bucX+u6nszW
      xwIDAQAB`
      certManager.amtCertSignWithCAKey(derkey, keys.privateKey, certAttr, issuerAttr, extKeyUsage)
      expect(createCertificateSpy).toHaveBeenCalledTimes(1)
      expect(generateLeafCertificateSpy).toHaveBeenCalled()
    })
    test('should set caPrivateKey to certAndKey.key if caPrivateKey is null', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)
      const createCertificateSpy = spyOn(certManager, 'createCertificate')
      const generateLeafCertificateSpy = spyOn(certManager, 'generateLeafCertificate')

      const certAttr: CertAttributes = { CN: 'AMT', O: 'None', ST: 'None', C: 'None' }
      const issuerAttr: CertAttributes = { CN: 'Untrusted Root Certificate' }
      const extKeyUsage: AMTKeyUsage = { name: 'extKeyUsage', serverAuth: true } as any
      const derkey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw51PMBm2psyIjHPU1efH
      Ulyh22zy3hEhlsNPH6/Cqg0HJorX1WbNKLfiU2aAt24jn4CC+y8PusrmMMCIca5x
      0L4XZxm14QvKKImIOMOMblS1Te29n64HuuQ9owKLHuSMww4wiLiY/nAvjK/5/kKT
      HL6x7nK/Pq72eoQ/etFBkaX5nYGUD/+G+5BgAPx1mBgU5/y9+/+QZ9xbYU6zogOW
      Tfa6rDMSAbmJOtkk1ghnuaq4dSoHWbW+zpHMVtjtHgzDGhX9KjOmvSDQIGn4wevD
      p2yDLULUbsdO4ylacTkxyIc92ZHdZeP6Hh+KhNC04Z65zwXLEA3M4bucX+u6nszW
      xwIDAQAB`
      certManager.amtCertSignWithCAKey(derkey, null, certAttr, issuerAttr, extKeyUsage)
      expect(createCertificateSpy).toHaveBeenCalledTimes(2)
      expect(generateLeafCertificateSpy).toHaveBeenCalled()
    })
  })
})
