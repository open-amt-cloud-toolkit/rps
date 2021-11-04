
/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Router } from 'express'
import { getAllDomains } from './all'
import { getDomain } from './getDomain'
import { createDomain } from './createDomain'
import { deleteDomain } from './deleteDomain'
import { editDomain } from './editDomain'
import { domainInsertValidator, domainUpdateValidator } from './domainValidator'
import { odataValidator } from '../odataValidator'
import validateMiddleware from '../../../middleware/validate'
const domainRouter: Router = Router()

domainRouter.get('/', odataValidator(), validateMiddleware, getAllDomains)
domainRouter.get('/:domainName', getDomain)
domainRouter.post('/', domainInsertValidator(), validateMiddleware, createDomain)
domainRouter.patch('/', domainUpdateValidator(), validateMiddleware, editDomain)
domainRouter.delete('/:domainName', deleteDomain)

export default domainRouter
