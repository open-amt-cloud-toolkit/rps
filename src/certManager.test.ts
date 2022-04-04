/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CertManager } from './CertManager'
import { NodeForge } from './NodeForge'
import { AMTKeyUsage, CertAttributes, CertificateObject } from './models'
import Logger from './Logger'
import { TEST_PFXCERT, EXPECTED_CERT } from './test/helper/certs'

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

  describe('dumpPfx tests', () => {
    test('Pulls the provisioning certificate apart and exports each PEM', () => {
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)

      const certChainPfx = certManager.dumpPfx(TEST_PFXCERT)

      expect(certChainPfx).toEqual(EXPECTED_CERT)
    })
  })
  describe('convertPfxToObject tests', () => {
    test('Extracts the provisioning certificate', () => {
      const pfxb64: string = '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'

      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)

      // convert the certificate pfx to an object
      const pfxobj = certManager.convertPfxToObject(pfxb64, 'Intel123!')

      expect(pfxobj.certs).toHaveLength(1)
      expect(pfxobj.keys).toHaveLength(1)

      const jsonPfxObj: string = JSON.stringify(pfxobj)
      const jsonPfxObj64 = Buffer.from(jsonPfxObj).toString('base64')

      const actual: string = 'eyJjZXJ0cyI6W3sidmVyc2lvbiI6Miwic2VyaWFsTnVtYmVyIjoiMzAzMjFiNGZhOWE5NDBhZjQ3YTRmZWM4YzM3YjdjYzIiLCJzaWduYXR1cmVPaWQiOiIxLjIuODQwLjExMzU0OS4xLjEuMTEiLCJzaWduYXR1cmUiOiLCjFvDmnXCkmlhwrrDj8ORYsKjwp7Cg19VwrLCsE9cdTAwMDTDscOlw4NbaERcdTAwMWPCp8KVQ29lKcO6ZVx1MDAwMMOoWVx1MDAwNMKNwoLDpcOrwqVcdTAwMWJcdTAwMDfClFxmf3Q0wrLCtm/CjzRoQMO+w7xpUytjwoXDjMK+asOZeMKBb3JcdTAwMTLCpS/CokbDsMOkVkVcZlx1MDAxNjNcImxhZmpcdTAwMGZcdTAwMGbCqHnDvlx1MDAxM8KmVMOjwrpcdTAwMDRcdTAwMTHDmsKpw45af0RcdTAwMDPDq8OeLcOjw6zDt8OqK2bDvMO4wr3CgMOuUMOzwphfw5Q9w5nChT3DnMKCXHUwMDBlw7VccsOswoIkXHUwMDBmfUhcdTAwMTA7woJHR8Oyw5pcdTAwMGXCmlx1MDAxY0ttw55cdTAwMDfCqcOtc1xubSMsXCIvaDHCk27DgCvDlMORwpbCoMOfw5FYXlxuXHLCusKvXHUwMDExKMOVXHUwMDAywrRzw5rCvlPDgi/Cu39cbsKMwrHCslx1MDAwZcKPdMOaw4ZcdTAwMDDDl1x1MDAwM8KlXHUwMDBmXHUwMDE0wqnCt8O9wobCpMK0w7PDsltcdTAwMWRcdTAwMTbCgG7DksOIwrlQJVx1MDAwNko9b01cdTAwMWNcdTAwMTN3M8OXfmE8TntccsOLw4p1w71cdTAwMWMoXGIsw4fCiCIsInNpZ2luZm8iOnsiYWxnb3JpdGhtT2lkIjoiMS4yLjg0MC4xMTM1NDkuMS4xLjExIiwicGFyYW1ldGVycyI6e319LCJ2YWxpZGl0eSI6eyJub3RCZWZvcmUiOiIyMDE5LTA4LTEzVDE2OjE3OjMyLjAwMFoiLCJub3RBZnRlciI6IjIwMjAtMDgtMTNUMDA6MDA6MDAuMDAwWiJ9LCJpc3N1ZXIiOnsiYXR0cmlidXRlcyI6W3sidHlwZSI6IjIuNS40LjMiLCJ2YWx1ZSI6ImJqb3NidXJuLWRlc2sxLmFtci5jb3JwLmludGVsLmNvbSIsInZhbHVlVGFnQ2xhc3MiOjE5LCJuYW1lIjoiY29tbW9uTmFtZSIsInNob3J0TmFtZSI6IkNOIn1dLCJoYXNoIjoiY2FiMTI4YjUwZjhlY2MwNDA4ZTA2NWU4ODEyZTE3MDQyNjQ2NThmZSJ9LCJzdWJqZWN0Ijp7ImF0dHJpYnV0ZXMiOlt7InR5cGUiOiIyLjUuNC4zIiwidmFsdWUiOiJiam9zYnVybi1kZXNrMS5hbXIuY29ycC5pbnRlbC5jb20iLCJ2YWx1ZVRhZ0NsYXNzIjoxOSwibmFtZSI6ImNvbW1vbk5hbWUiLCJzaG9ydE5hbWUiOiJDTiJ9XSwiaGFzaCI6ImNhYjEyOGI1MGY4ZWNjMDQwOGUwNjVlODgxMmUxNzA0MjY0NjU4ZmUifSwiZXh0ZW5zaW9ucyI6W3siaWQiOiIyLjUuMjkuMTUiLCJjcml0aWNhbCI6ZmFsc2UsInZhbHVlIjoiXHUwMDAzXHUwMDAyXHUwMDA0MCIsIm5hbWUiOiJrZXlVc2FnZSIsImRpZ2l0YWxTaWduYXR1cmUiOmZhbHNlLCJub25SZXB1ZGlhdGlvbiI6ZmFsc2UsImtleUVuY2lwaGVybWVudCI6dHJ1ZSwiZGF0YUVuY2lwaGVybWVudCI6dHJ1ZSwia2V5QWdyZWVtZW50IjpmYWxzZSwia2V5Q2VydFNpZ24iOmZhbHNlLCJjUkxTaWduIjpmYWxzZSwiZW5jaXBoZXJPbmx5IjpmYWxzZSwiZGVjaXBoZXJPbmx5IjpmYWxzZX0seyJpZCI6IjIuNS4yOS4zNyIsImNyaXRpY2FsIjpmYWxzZSwidmFsdWUiOiIwXG5cdTAwMDZcYitcdTAwMDZcdTAwMDFcdTAwMDVcdTAwMDVcdTAwMDdcdTAwMDNcdTAwMDEiLCJuYW1lIjoiZXh0S2V5VXNhZ2UiLCJzZXJ2ZXJBdXRoIjp0cnVlfSx7ImlkIjoiMi41LjI5LjE3IiwiY3JpdGljYWwiOmZhbHNlLCJ2YWx1ZSI6IjAjwoIhYmpvc2J1cm4tZGVzazEuYW1yLmNvcnAuaW50ZWwuY29tIiwibmFtZSI6InN1YmplY3RBbHROYW1lIiwiYWx0TmFtZXMiOlt7InR5cGUiOjIsInZhbHVlIjoiYmpvc2J1cm4tZGVzazEuYW1yLmNvcnAuaW50ZWwuY29tIn1dfV0sInB1YmxpY0tleSI6eyJuIjp7ImRhdGEiOlsyMjczODU0NSwxOTc1ODc5NzUsNDAzODk2MzIsMTI4NTc0NzE4LDI0MDUwNjYwOSw2MzgwODAwNCw2NzE4NzA1MiwzNTkxOTU3MiwxNjk3MzczNjYsMzM5MzY1NjUsMTg1NjM1NjIwLDE0NzQ5Mjk5MCwyMTI4NjY1NTUsODQzOTU3MDcsMTg1NDE2NDQ2LDkzNTg3NjcsMjAyNDQ1MDU0LDIzNjcwMzQ1MCw0ODk2NjM2OCwxMzgxNjEzMTgsMTE4MTQ4NDU2LDI0MzA2Njk3NiwxNzA4MTA4ODksNTkwNjE1MDgsMzg3MjExMTEsNTgyMjE5OSwxMzg3MDkwMzYsMTAyMTAyOTMxLDExNjIyNjYzOSwyNjU3MTMzMTYsNzE2MDc4NywxMzQzMDg0NjksMjI2NDI3OTcwLDE5ODQ2ODI3MSwyODczODUzOCwxMTgwOTU3NDYsMjAxMzM4NzUxLDgxOTcwNDU1LDY3Nzc4MDI4LDQ2ODMzMjM5LDIwMjAwMzE4LDE5MDY5MDYzNywxOTMwOTkxNDgsMTg3ODI3OSwyNTIxNDQ2MzcsMjUzMTE4ODU1LDc2OTg0NzE0LDgyNDQ3MjY0LDI0MDEyMjcwMSwyMTM3OTYyNzcsOTQxODQ1NDgsMTI3NjE3MzMyLDcwOTg1MzE1LDMwMzcwNzM1LDI2NjU1MDYyMCw4NTQyMTU0NywxNTkxODgzNjgsMjAyNDAwMzMyLDIxODkyNTgxMywxMjkyMTUxNTYsMjMyMzQ2OTQwLDExNzYxODI0OCwyNjg0MTYyOTgsNzgwNTkzOSwyMjc5ODM5ODksNTYwOTMxMTEsMjM2MjEyODgyLDIzMDYyNjAzMSwxMjA1OTM3NzEsODUzODE5MDksOTMxMjEyODIsMjYwMzEyODgxLDg2NTIxNzYwLDEyXSwidCI6NzQsInMiOjB9LCJlIjp7ImRhdGEiOls2NTUzN10sInQiOjEsInMiOjB9fSwibWQiOnsiYWxnb3JpdGhtIjoic2hhMjU2IiwiYmxvY2tMZW5ndGgiOjY0LCJkaWdlc3RMZW5ndGgiOjMyLCJtZXNzYWdlTGVuZ3RoIjo1NDQsImZ1bGxNZXNzYWdlTGVuZ3RoIjpbMCw1NDRdLCJtZXNzYWdlTGVuZ3RoU2l6ZSI6OCwibWVzc2FnZUxlbmd0aDY0IjpbMCw1NDRdfSwic2lnbmF0dXJlUGFyYW1ldGVycyI6e30sInRic0NlcnRpZmljYXRlIjp7InRhZ0NsYXNzIjowLCJ0eXBlIjoxNiwiY29uc3RydWN0ZWQiOnRydWUsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjEyOCwidHlwZSI6MCwiY29uc3RydWN0ZWQiOnRydWUsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjAsInR5cGUiOjIsImNvbnN0cnVjdGVkIjpmYWxzZSwiY29tcG9zZWQiOmZhbHNlLCJ2YWx1ZSI6Ilx1MDAwMiJ9XX0seyJ0YWdDbGFzcyI6MCwidHlwZSI6MiwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiMDJcdTAwMWJPwqnCqUDCr0fCpMO+w4jDg3t8w4IifSx7InRhZ0NsYXNzIjowLCJ0eXBlIjoxNiwiY29uc3RydWN0ZWQiOnRydWUsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjAsInR5cGUiOjYsImNvbnN0cnVjdGVkIjpmYWxzZSwiY29tcG9zZWQiOmZhbHNlLCJ2YWx1ZSI6IirChkjChsO3XHJcdTAwMDFcdTAwMDFcdTAwMGIifSx7InRhZ0NsYXNzIjowLCJ0eXBlIjo1LCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjpmYWxzZSwidmFsdWUiOiIifV19LHsidGFnQ2xhc3MiOjAsInR5cGUiOjE2LCJjb25zdHJ1Y3RlZCI6dHJ1ZSwiY29tcG9zZWQiOnRydWUsInZhbHVlIjpbeyJ0YWdDbGFzcyI6MCwidHlwZSI6MTcsImNvbnN0cnVjdGVkIjp0cnVlLCJjb21wb3NlZCI6dHJ1ZSwidmFsdWUiOlt7InRhZ0NsYXNzIjowLCJ0eXBlIjoxNiwiY29uc3RydWN0ZWQiOnRydWUsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjAsInR5cGUiOjYsImNvbnN0cnVjdGVkIjpmYWxzZSwiY29tcG9zZWQiOmZhbHNlLCJ2YWx1ZSI6IlVcdTAwMDRcdTAwMDMifSx7InRhZ0NsYXNzIjowLCJ0eXBlIjoxOSwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiYmpvc2J1cm4tZGVzazEuYW1yLmNvcnAuaW50ZWwuY29tIn1dfV19XX0seyJ0YWdDbGFzcyI6MCwidHlwZSI6MTYsImNvbnN0cnVjdGVkIjp0cnVlLCJjb21wb3NlZCI6dHJ1ZSwidmFsdWUiOlt7InRhZ0NsYXNzIjowLCJ0eXBlIjoyMywiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiMTkwODEzMTYxNzMyWiJ9LHsidGFnQ2xhc3MiOjAsInR5cGUiOjIzLCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjpmYWxzZSwidmFsdWUiOiIyMDA4MTMwMDAwMDBaIn1dfSx7InRhZ0NsYXNzIjowLCJ0eXBlIjoxNiwiY29uc3RydWN0ZWQiOnRydWUsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjAsInR5cGUiOjE3LCJjb25zdHJ1Y3RlZCI6dHJ1ZSwiY29tcG9zZWQiOnRydWUsInZhbHVlIjpbeyJ0YWdDbGFzcyI6MCwidHlwZSI6MTYsImNvbnN0cnVjdGVkIjp0cnVlLCJjb21wb3NlZCI6dHJ1ZSwidmFsdWUiOlt7InRhZ0NsYXNzIjowLCJ0eXBlIjo2LCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjpmYWxzZSwidmFsdWUiOiJVXHUwMDA0XHUwMDAzIn0seyJ0YWdDbGFzcyI6MCwidHlwZSI6MTksImNvbnN0cnVjdGVkIjpmYWxzZSwiY29tcG9zZWQiOmZhbHNlLCJ2YWx1ZSI6ImJqb3NidXJuLWRlc2sxLmFtci5jb3JwLmludGVsLmNvbSJ9XX1dfV19LHsidGFnQ2xhc3MiOjAsInR5cGUiOjE2LCJjb25zdHJ1Y3RlZCI6dHJ1ZSwiY29tcG9zZWQiOnRydWUsInZhbHVlIjpbeyJ0YWdDbGFzcyI6MCwidHlwZSI6MTYsImNvbnN0cnVjdGVkIjp0cnVlLCJjb21wb3NlZCI6dHJ1ZSwidmFsdWUiOlt7InRhZ0NsYXNzIjowLCJ0eXBlIjo2LCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjpmYWxzZSwidmFsdWUiOiIqwoZIwobDt1xyXHUwMDAxXHUwMDAxXHUwMDAxIn0seyJ0YWdDbGFzcyI6MCwidHlwZSI6NSwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiIn1dfSx7InRhZ0NsYXNzIjowLCJ0eXBlIjozLCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjAsInR5cGUiOjE2LCJjb25zdHJ1Y3RlZCI6dHJ1ZSwiY29tcG9zZWQiOnRydWUsInZhbHVlIjpbeyJ0YWdDbGFzcyI6MCwidHlwZSI6MiwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiXHUwMDAww4UoN8Kgw7hAw7NcdTAwMTXCjMOrXHUwMDAyUW0xVzBcdTAwMWRrw5vDsS7Dvlx1MDAxNFLCkjV+wpt9wpbDgnVcdTAwMDdxwr8/w7/CtSpwK2TCjcOZVTx7OsKrTVxmworDtcOBXHUwMDA2JMOJfVx1MDAwNcKQUXbDnsK/w6M9XFxcdTAwMWPDtsK6w7Q7JmN5wrTCk0XCnSRkw4vDpFteT8O7TU7CoMK6XHUwMDA0wpbCscKKw7Fkwph/XHUwMDA3a8O9XHUwMDAxw4rCkHvCgnXCjMK1w5tUw5E0O34swqnDpXRcbjXDrE4sUXxcdTAwMDAvf3DCn8O4IcK2woPDqsK9RirDvX9cdTAwMDRCwoBcdTAwMTYnUG1Dw5PDvWdqRsOtek9hX3k4RMKILFx1MDAwNcKNb3JOw5ZXOFNQSi5eXHTDp8OOwoZcdTAwMDdcbsONaMKDw4LDimLDqyrDoMOhwrzDrcKsXHUwMDExXHUwMDEww75cYsOsw5rDu1xyOsO+UHxrwrzCsFx1MDAxNcO7wozCqVx1MDAwN8OrXHUwMDEwwpMkIF1LWlx1MDAxZMO8wpZcIkFtRFx1MDAwMTFsPMOaIE5Vw5bDsXrCnk/DomhMXHUwMDAwwrxvQHFaw7ZxIn0seyJ0YWdDbGFzcyI6MCwidHlwZSI6MiwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiXHUwMDAxXHUwMDAwXHUwMDAxIn1dfV0sImJpdFN0cmluZ0NvbnRlbnRzIjoiXHUwMDAwMMKCXHUwMDAxXG5cdTAwMDLCglx1MDAwMVx1MDAwMVx1MDAwMMOFKDfCoMO4QMOzXHUwMDE1wozDq1x1MDAwMlFtMVcwXHUwMDFka8Obw7Euw75cdTAwMTRSwpI1fsKbfcKWw4J1XHUwMDA3ccK/P8O/wrUqcCtkwo3DmVU8ezrCq01cZsKKw7XDgVx1MDAwNiTDiX1cdTAwMDXCkFF2w57Cv8OjPVxcXHUwMDFjw7bCusO0OyZjecK0wpNFwp0kZMOLw6RbXk/Du01OwqDCulx1MDAwNMKWwrHCisOxZMKYf1x1MDAwN2vDvVx1MDAwMcOKwpB7woJ1wozCtcObVMORNDt+LMKpw6V0XG41w6xOLFF8XHUwMDAwL39wwp/DuCHCtsKDw6rCvUYqw71/XHUwMDA0QsKAXHUwMDE2J1BtQ8OTw71nakbDrXpPYV95OETCiCxcdTAwMDXCjW9yTsOWVzhTUEouXlx0w6fDjsKGXHUwMDA3XG7DjWjCg8OCw4piw6sqw6DDocK8w63CrFx1MDAxMVx1MDAxMMO+XGLDrMOaw7tccjrDvlB8a8K8wrBcdTAwMTXDu8KMwqlcdTAwMDfDq1x1MDAxMMKTJCBdS1pcdTAwMWTDvMKWXCJBbURcdTAwMDExbDzDmiBOVcOWw7F6wp5Pw6JoTFx1MDAwMMK8b0BxWsO2cVx1MDAwMlx1MDAwM1x1MDAwMVx1MDAwMFx1MDAwMSIsIm9yaWdpbmFsIjp7InRhZ0NsYXNzIjowLCJ0eXBlIjozLCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjAsInR5cGUiOjE2LCJjb25zdHJ1Y3RlZCI6dHJ1ZSwiY29tcG9zZWQiOnRydWUsInZhbHVlIjpbeyJ0YWdDbGFzcyI6MCwidHlwZSI6MiwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiXHUwMDAww4UoN8Kgw7hAw7NcdTAwMTXCjMOrXHUwMDAyUW0xVzBcdTAwMWRrw5vDsS7Dvlx1MDAxNFLCkjV+wpt9wpbDgnVcdTAwMDdxwr8/w7/CtSpwK2TCjcOZVTx7OsKrTVxmworDtcOBXHUwMDA2JMOJfVx1MDAwNcKQUXbDnsK/w6M9XFxcdTAwMWPDtsK6w7Q7JmN5wrTCk0XCnSRkw4vDpFteT8O7TU7CoMK6XHUwMDA0wpbCscKKw7Fkwph/XHUwMDA3a8O9XHUwMDAxw4rCkHvCgnXCjMK1w5tUw5E0O34swqnDpXRcbjXDrE4sUXxcdTAwMDAvf3DCn8O4IcK2woPDqsK9RirDvX9cdTAwMDRCwoBcdTAwMTYnUG1Dw5PDvWdqRsOtek9hX3k4RMKILFx1MDAwNcKNb3JOw5ZXOFNQSi5eXHTDp8OOwoZcdTAwMDdcbsONaMKDw4LDimLDqyrDoMOhwrzDrcKsXHUwMDExXHUwMDEww75cYsOsw5rDu1xyOsO+UHxrwrzCsFx1MDAxNcO7wozCqVx1MDAwN8OrXHUwMDEwwpMkIF1LWlx1MDAxZMO8wpZcIkFtRFx1MDAwMTFsPMOaIE5Vw5bDsXrCnk/DomhMXHUwMDAwwrxvQHFaw7ZxIn0seyJ0YWdDbGFzcyI6MCwidHlwZSI6MiwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiXHUwMDAxXHUwMDAwXHUwMDAxIn1dfV19fV19LHsidGFnQ2xhc3MiOjEyOCwidHlwZSI6MywiY29uc3RydWN0ZWQiOnRydWUsImNvbXBvc2VkIjp0cnVlLCJ2YWx1ZSI6W3sidGFnQ2xhc3MiOjAsInR5cGUiOjE2LCJjb25zdHJ1Y3RlZCI6dHJ1ZSwiY29tcG9zZWQiOnRydWUsInZhbHVlIjpbeyJ0YWdDbGFzcyI6MCwidHlwZSI6MTYsImNvbnN0cnVjdGVkIjp0cnVlLCJjb21wb3NlZCI6dHJ1ZSwidmFsdWUiOlt7InRhZ0NsYXNzIjowLCJ0eXBlIjo2LCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjpmYWxzZSwidmFsdWUiOiJVXHUwMDFkXHUwMDBmIn0seyJ0YWdDbGFzcyI6MCwidHlwZSI6NCwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiXHUwMDAzXHUwMDAyXHUwMDA0MCJ9XX0seyJ0YWdDbGFzcyI6MCwidHlwZSI6MTYsImNvbnN0cnVjdGVkIjp0cnVlLCJjb21wb3NlZCI6dHJ1ZSwidmFsdWUiOlt7InRhZ0NsYXNzIjowLCJ0eXBlIjo2LCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjpmYWxzZSwidmFsdWUiOiJVXHUwMDFkJSJ9LHsidGFnQ2xhc3MiOjAsInR5cGUiOjQsImNvbnN0cnVjdGVkIjpmYWxzZSwiY29tcG9zZWQiOmZhbHNlLCJ2YWx1ZSI6IjBcblx1MDAwNlxiK1x1MDAwNlx1MDAwMVx1MDAwNVx1MDAwNVx1MDAwN1x1MDAwM1x1MDAwMSJ9XX0seyJ0YWdDbGFzcyI6MCwidHlwZSI6MTYsImNvbnN0cnVjdGVkIjp0cnVlLCJjb21wb3NlZCI6dHJ1ZSwidmFsdWUiOlt7InRhZ0NsYXNzIjowLCJ0eXBlIjo2LCJjb25zdHJ1Y3RlZCI6ZmFsc2UsImNvbXBvc2VkIjpmYWxzZSwidmFsdWUiOiJVXHUwMDFkXHUwMDExIn0seyJ0YWdDbGFzcyI6MCwidHlwZSI6NCwiY29uc3RydWN0ZWQiOmZhbHNlLCJjb21wb3NlZCI6ZmFsc2UsInZhbHVlIjoiMCPCgiFiam9zYnVybi1kZXNrMS5hbXIuY29ycC5pbnRlbC5jb20ifV19XX1dfV19fV0sImtleXMiOlt7Im4iOnsiZGF0YSI6WzIyNzM4NTQ1LDE5NzU4Nzk3NSw0MDM4OTYzMiwxMjg1NzQ3MTgsMjQwNTA2NjA5LDYzODA4MDA0LDY3MTg3MDUyLDM1OTE5NTcyLDE2OTczNzM2NiwzMzkzNjU2NSwxODU2MzU2MjAsMTQ3NDkyOTkwLDIxMjg2NjU1NSw4NDM5NTcwNywxODU0MTY0NDYsOTM1ODc2NywyMDI0NDUwNTQsMjM2NzAzNDUwLDQ4OTY2MzY4LDEzODE2MTMxOCwxMTgxNDg0NTYsMjQzMDY2OTc2LDE3MDgxMDg4OSw1OTA2MTUwOCwzODcyMTExMSw1ODIyMTk5LDEzODcwOTAzNiwxMDIxMDI5MzEsMTE2MjI2NjM5LDI2NTcxMzMxNiw3MTYwNzg3LDEzNDMwODQ2OSwyMjY0Mjc5NzAsMTk4NDY4MjcxLDI4NzM4NTM4LDExODA5NTc0NiwyMDEzMzg3NTEsODE5NzA0NTUsNjc3NzgwMjgsNDY4MzMyMzksMjAyMDAzMTgsMTkwNjkwNjM3LDE5MzA5OTE0OCwxODc4Mjc5LDI1MjE0NDYzNywyNTMxMTg4NTUsNzY5ODQ3MTQsODI0NDcyNjQsMjQwMTIyNzAxLDIxMzc5NjI3Nyw5NDE4NDU0OCwxMjc2MTczMzIsNzA5ODUzMTUsMzAzNzA3MzUsMjY2NTUwNjIwLDg1NDIxNTQ3LDE1OTE4ODM2OCwyMDI0MDAzMzIsMjE4OTI1ODEzLDEyOTIxNTE1NiwyMzIzNDY5NDAsMTE3NjE4MjQ4LDI2ODQxNjI5OCw3ODA1OTM5LDIyNzk4Mzk4OSw1NjA5MzExMSwyMzYyMTI4ODIsMjMwNjI2MDMxLDEyMDU5Mzc3MSw4NTM4MTkwOSw5MzEyMTI4MiwyNjAzMTI4ODEsODY1MjE3NjAsMTJdLCJ0Ijo3NCwicyI6MH0sImUiOnsiZGF0YSI6WzY1NTM3XSwidCI6MSwicyI6MH0sImQiOnsiZGF0YSI6WzEwMzc1ODYyOSwzNTE4MDMxLDIwNzcwNzY3NCwyMDc4Nzg2MjUsMzIzMzAxODAsMTkwNTg0NDQsNTg4ODI3NjYsMTg3NjQ1NDEsODIzMzkzNzYsMTA3MjM0NzY1LDU4OTA3MzE2LDIxNTIwMjE4LDg3NTY1OTM1LDI1NTQ3OTU2NCw0NTg4MDIyNywyMTg3MTAyNiwyNDM4NDk3MzcsMjIxMzA5MzcxLDEyMjczNzYyNSw5NzM2NjAzMiwxNzQwMDA0MDYsMTk3ODg0NTY2LDU1Mjg0NTY0LDM4Njk1NjU4LDEyNjEyODAzMSw4OTY1OTI3NSwxMTQyNzExMDYsMTg5NDgwMTQ2LDM2Njk1NDYxLDExNzQwMjEyMSw4MjE0NzExMywxNDM1MDc5MTUsMTUwMjY4MjkyLDExMTM3MTkzMCwxMTkzOTIwNDcsNDM0NDY3MjgsMjYxNDAzMDg0LDIwMTUxOTEwNSwxNTkwNjM5NDEsOTE0MjQwOTQsMTIxMTUyMjAxLDIxNDMwNTkwMSwyMDU5MjY4OTYsNTg1Nzg0MzksOTA3MjcxNTIsMjEyNjQ5ODgsMTAxNjc2NTY3LDE4MzgzMDEyOCwxODIzNzc3MTMsMTM3NzIzMzA3LDIxNzEwODI2Myw5MzM5ODU3MSwxODIyNTA0NiwyNjQxMjk2MjYsMjYzODg5OTI4LDIxODg5NTI0OCwxNTUzOTM5MDQsMjE0NTc2MDQ4LDE0ODgzNDQwNiwxOTc1NTk2NTEsNjA3Mjc2NTAsMTk2NzM2MjE3LDI1ODIxODE1NywyNTM0NTIzMzcsMjY0Nzk1OTQ0LDE5OTMyOTgxNyw0OTIzODYyOCwyMzMyNzkxNjEsNjE2ODg5OTIsMzU5Mjk2MTYsMjA2ODU4MTQzLDE1MzkwNDI0Myw4MjA4ODc0NCwxXSwidCI6NzQsInMiOjB9LCJwIjp7ImRhdGEiOlsyMjU4Njc2ODcsMTM3Mjc3OTcwLDE4Njc1NDE4MywxNzE0MzgwOTgsMTQ3NzkxNDc3LDI2NDI0ODAxLDIyNTA1OTM1NCwyNTE0MTgzMDksMTQwMTMyNDk0LDI3MjI0MzUyLDgyMzc5MDQ2LDI2MjgzMDE4MSwyMjgyODMzNTAsMjE4MDAxNzkxLDE5ODQyNTk1NCwyMTQyMTIxNDgsMjA0NDExNjg4LDExODEyMzkzLDc1OTc3OTcyLDU1MTU2NDksMTM5Mjk0OTg3LDI2OTIyMjUsNDIxMzYyOTksNzYzMTYwNjksMjUxMTc1MjgzLDIzNTQzNDIwOCwxNjg5ODYwOTUsNTA3NDk5MTUsNTk1MDk0NzMsMTU5MTk2NzQ3LDE0NTQxODI2LDc4NjgxNjkwLDMzOTAyNTE2LDE5MzczOTAxMiwxODUzMjU2MDksMTYxNDgwMjgsNTUyMTVdLCJ0IjozNywicyI6MH0sInEiOnsiZGF0YSI6WzEzNTQ1NTc4MywxNDE2NzUyMjYsNzI0NTU1NjMsMTkyMzE2NTM1LDIyNzU2MTY4Myw5MjQ0Mzg1LDE1MDQxNzAzOSwxNzkwNDcwMTAsMjQwNzcwNDgzLDIzNzI3ODI4MiwyNTUyMDAzNzYsOTg5MjUwMiwyMzI3MzcwNjQsMTgxMTM4MTY5LDQzMjEzMTg4LDEyMDE0MTQ2NSw2MTcxMDUyMSwxMDM2MjQyMTYsMTMxNzgwOTAxLDE2NzY4ODUwNywxNDY1NTQ0NjUsMjYwMzYxMzMsOTU5MjA2NjcsOTkwMzU1MzEsNTE1MTkxMDEsOTIwOTI4ODUsMjQzMjM1NDc4LDE0OTk3MjMyNywxNTU1MzU5NywxMzYzOTE3NzAsMjAxNzcyMzY0LDE5NTE3Mjc1NywxOTQyMjAxNDcsMTU0NzA0MTgyLDE4NTkwODk3OSwxNjQ1MTQxMTYsNTk5MDZdLCJ0IjozNywicyI6MH0sImRQIjp7ImRhdGEiOlsyMTI2NTAyNDksNTkzMjcxOSwzMTMwNjcxMSwxOTQ1MjkxMjMsNDkwMDExMiwyNTUwOTE4MCwxODMwMDM0NzMsMzA5MzAzMTgsMTA4Njg4MjYyLDU0NjU5Njc4LDIwODQ5NTg3MCw1MjgxMDQ3MSwxOTIwODQ3MjAsMjMwMDg2MTUyLDE5Mzc4OTg4NCw3OTI2OTMyOCwyNjE1MTIyMjcsMTI1NTU2NzgzLDE1NTA4NDYyMywxOTQ5Mjg3MjcsMjI3NzI0NTY4LDE4NjA0ODQ2OSwxNTIwMzkwNjYsMzkwMTMwOTksMjMzNzU2MjM4LDE4NTY5MjU1OSwyMzgxNjM3MzIsNDA2MTM5NDIsMjM1MDk1Mjg0LDIwNjA0MzU3OSw5NjE5NTUxNSwxNTI0MjMxMDUsOTUwOTE5NSwxOTg2MjMyNzQsMTgxMjc0Mjc1LDE5OTkwMzgzMiwyOTk2Ml0sInQiOjM3LCJzIjowfSwiZFEiOnsiZGF0YSI6WzIxNDg4NDg0NywyMDQ0ODU5MzIsMjU0NzMzMzQ0LDIwNzg2MTE2MSw4NDAxNjExNSwyMDUzMzc4NjYsMTkxNDEyMDk3LDIyMjA3NDI2MCwxNDQ2OTI2NTEsMjI0OTU3MzM5LDc1MDIxNjYyLDIyNzE2MjExNyw3NDUyNjMyNywxNTIwNTIwOSwxNjIwNjYwNzAsMzMxODUxNjIsMjQxNzI4NjgyLDE1OTI5MzczNiwxNjc1OTY0ODEsMzU1NTExNSwyNTU1MTk0NDEsNjU3MzEyODAsMTEyNTM4MzM4LDYwMzQ0MTgzLDI0NDk5MzQyMiwyMDg4NTY0OCwxNTE0NzQ3OTEsMjU3ODQ0NjQxLDE3MzkxOTMxOSwyMjE1MzE4NTksMTIyNzYxODg5LDE0MDkwMzE3NiwxMTE4NTEyNTIsMjQzNTE4MDk0LDEzODU4ODQ4OCwyNDA2MzEyMjAsNDc5XSwidCI6MzcsInMiOjB9LCJxSW52Ijp7ImRhdGEiOlsxMTQ2MjYxNzAsMjI1Njg5OTcwLDYzNTE2MDI0LDE0ODI3NjUxNywyMTg2ODM0NzQsMTkyNDQ3Mjk2LDEzMDU3MjIxOSwyMjMxNDU5MjEsMjM3MDg3NTI2LDE5NzAxNDQyNCwyMzI4OTUwMjEsMTkzMDMxOTg1LDYyNTI4MzE4LDEyNTk3MDM2LDg1NzA4MzU5LDk1ODA0NjgxLDU5MjA4MDAwLDE5MTA1MzQ1LDExMjkxOTU2NSwxMzA2NDIwMjYsMTg0Mjg3MDg0LDIwODk2Njg0Niw5OTIwMDMzNywxMzgzNDEwMzYsMTYwNjk1MTg4LDUxOTg1OTU3LDYyNzQ5MTY0LDIxMDYyMDMwMywxNjE2MDUwMDcsODQ5MzI1MjAsMjE5ODgyMzgzLDIwMTM0ODA4NywxOTYyMTM4MzgsMzk5Njk1MTMsMjY0MDAzNTE0LDY4OTU3NjI4LDE0MjE4XSwidCI6MzcsInMiOjB9fV19'

      expect(actual).toEqual(jsonPfxObj64)
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
      const leafSpy = jest.spyOn(certManager, 'generateLeafCertificate')

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
      const rootSpy = jest.spyOn(certManager, 'generateRootCertificate')
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
      const createCertificateSpy = jest.spyOn(certManager, 'createCertificate')
      const generateLeafCertificateSpy = jest.spyOn(certManager, 'generateLeafCertificate')

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
      const createCertificateSpy = jest.spyOn(certManager, 'createCertificate')
      const generateLeafCertificateSpy = jest.spyOn(certManager, 'generateLeafCertificate')

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
