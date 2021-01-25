/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/

import { ICertManager } from './interfaces/ICertManager'
import { CertificateObject, ProvisioningCertObj } from './models/Rcs'
import { INodeForge } from './interfaces/INodeForge'

export class CertManager implements ICertManager {
  private readonly nodeForge: INodeForge

  constructor (nodeForge: INodeForge) {
    this.nodeForge = nodeForge
  }

  /**
      * @description Sorts the intermediate certificates to properly order the certificate chain
      * @param {CertificateObject} intermediate
      * @param {CertificateObject} root
      * @returns {boolean} Returns true if issuer is from root.  Returns false if issuer is not from root.
      */
  sortCertificate (intermediate: CertificateObject, root: CertificateObject): boolean {
    if (intermediate.issuer === root.subject) {
      return true
    } else {
      return false
    }
  }

  /**
   * @description Pulls the provisioning certificate apart and exports each PEM for injecting into AMT.  Only supports certificate chains up to 4 certificates long
   * @param {any} pfxobj Certificate object from convertPfxToObject function
   * @returns {any} Returns provisioning certificiate object with certificate chain in proper order and fingerprint
   */
  dumpPfx (pfxobj: any): any {
    const provisioningCertificateObj = new ProvisioningCertObj()
    const interObj = new Array<CertificateObject>()
    const leaf = new CertificateObject()
    const root = new CertificateObject()
    if (pfxobj) {
      let fingerprint: string
      if (pfxobj.certs && Array.isArray(pfxobj.certs)) {
        for (let i = 0; i < pfxobj.certs.length; i++) {
          const cert: any = pfxobj.certs[i]
          let pem: any = this.nodeForge.pkiCertificateToPem(cert)
          // Need to trim off the BEGIN and END so we just have the raw pem
          pem = pem.replace('-----BEGIN CERTIFICATE-----', '')
          pem = pem.replace('-----END CERTIFICATE-----', '')
          // pem = pem.replace(/(\r\n|\n|\r)/g, '');
          // Index 0 = Leaf, Root subject.hash will match issuer.hash, rest are Intermediate.
          if (i === 0) {
            leaf.pem = pem
            leaf.subject = cert.subject.hash
            leaf.issuer = cert.issuer.hash
          } else if (cert.subject.hash === cert.issuer.hash) {
            root.pem = pem
            root.subject = cert.subject.hash
            root.issuer = cert.issuer.hash
            const der: string = this.nodeForge.asn1ToDer(this.nodeForge.pkiCertificateToAsn1(cert)).getBytes()
            const md: any = this.nodeForge.sha256Create()

            md.update(der)
            fingerprint = md.digest().toHex()
          } else {
            const inter = new CertificateObject()
            inter.pem = pem
            inter.issuer = cert.issuer.hash
            inter.subject = cert.subject.hash
            interObj.push(inter)
          }
        }
      }

      // Need to put the certificate PEMs in the correct order before sending to AMT.
      // This currently only supports certificate chains that are no more than 4 certificates long
      provisioningCertificateObj.certChain = []
      // Leaf PEM is first
      provisioningCertificateObj.certChain.push(leaf.pem)
      // Need to figure out which Intermediate PEM is next to the Leaf PEM
      for (let k = 0; k < interObj.length; k++) {
        if (!this.sortCertificate(interObj[k], root)) {
          provisioningCertificateObj.certChain.push(interObj[k].pem)
        }
      }
      // Need to figure out which Intermediate PEM is next to the Root PEM
      for (let l = 0; l < interObj.length; l++) {
        if (this.sortCertificate(interObj[l], root)) {
          provisioningCertificateObj.certChain.push(interObj[l].pem)
        }
      }
      // Root PEM goes in last
      provisioningCertificateObj.certChain.push(root.pem)
      if (pfxobj.keys && Array.isArray(pfxobj.keys)) {
        for (let i = 0; i < pfxobj.keys.length; i++) {
          const key: any = pfxobj.keys[i]
          // Just need the key in key format for signing.  Keeping the private key in memory only.
          provisioningCertificateObj.privateKey = key
        }
      }

      return { provisioningCertificateObj, fingerprint }
    }
  }

  /**
     * @description Extracts the provisioning certificate into an object for later manipulation
     * @param {string} pfxb64 provisioning certificate
     * @param {string} passphrase Password to open provisioning certificate
     * @returns {object} Object containing cert pems and private key
     */
  convertPfxToObject (pfxb64: string, passphrase: string): any {
    const pfxOut: any = { certs: [], keys: [] }

    const pfxder: string = this.nodeForge.decode64(pfxb64)
    const asn: any = this.nodeForge.asn1FromDer(pfxder)
    let pfx: any
    try {
      pfx = this.nodeForge.pkcs12FromAsn1(asn, true, passphrase)
    } catch (e) {
      return { errorText: 'Decrypting provisioning certificate failed.' }
    }
    // Get the certs from certbags
    let bags: any = pfx.getBags({ bagType: this.nodeForge.pkiOidsCertBag })
    for (let i = 0; i < bags[this.nodeForge.pkiOidsCertBag].length; i++) {
      // dump cert into DER
      const cert: any = bags[this.nodeForge.pkiOidsCertBag][i]
      pfxOut.certs.push(cert.cert)
    }
    // get shrouded key from key bags
    bags = pfx.getBags({ bagType: this.nodeForge.pkcs8ShroudedKeyBag })
    bags = pfx.getBags({ bagType: this.nodeForge.pkcs8ShroudedKeyBag })
    for (let i = 0; i < bags[this.nodeForge.pkcs8ShroudedKeyBag].length; i++) {
      // dump cert into DER
      const cert: any = bags[this.nodeForge.pkcs8ShroudedKeyBag][i]
      pfxOut.keys.push(cert.key)
    }
    return pfxOut
  }
}
