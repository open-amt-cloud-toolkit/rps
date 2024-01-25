/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'
import { getAllDomains } from './all.js'
import { getDomain } from './get.js'
import { DomainCreate } from './create.js'
import { deleteDomain } from './delete.js'
import { editDomain } from './edit.js'
import { domainInsertValidator, domainUpdateValidator } from './domain.js'
import { odataValidator } from '../odataValidator.js'
import validateMiddleware from '../../../middleware/validate.js'
const domainRouter: Router = Router()
const dc = new DomainCreate()
domainRouter.get('/', odataValidator(), validateMiddleware, getAllDomains)
domainRouter.get('/:domainName', getDomain)
domainRouter.post('/', domainInsertValidator(), validateMiddleware, dc.createDomain)
domainRouter.patch('/', domainUpdateValidator(), validateMiddleware, editDomain)
domainRouter.delete('/:domainName', deleteDomain)

export default domainRouter
