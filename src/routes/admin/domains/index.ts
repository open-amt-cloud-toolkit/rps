/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'
import { getAllDomains } from './all'
import { getDomain } from './get'
import { createDomain } from './create'
import { deleteDomain } from './delete'
import { editDomain } from './edit'
import { domainInsertValidator, domainUpdateValidator } from './domain'
import { odataValidator } from '../odataValidator'
import validateMiddleware from '../../../middleware/validate'
const domainRouter: Router = Router()

domainRouter.get('/', odataValidator(), validateMiddleware, getAllDomains)
domainRouter.get('/:domainName', getDomain)
domainRouter.post('/', domainInsertValidator(), validateMiddleware, createDomain)
domainRouter.patch('/', domainUpdateValidator(), validateMiddleware, editDomain)
domainRouter.delete('/:domainName', deleteDomain)

export default domainRouter
