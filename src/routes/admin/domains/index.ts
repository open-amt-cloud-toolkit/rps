
/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { Router } from 'express'
import { getAllDomains } from './all'
import { getDomain } from './getDomain'
import { createDomain } from './createDomain'
import { deleteDomain } from './deleteDomain'
import { editDomain } from './editDomain'
import { domainInsertValidator, domainUpdateValidator } from './domainValidator'
const domainRouter: Router = Router()

domainRouter.get('/', getAllDomains)
domainRouter.get('/:domainName', getDomain)
domainRouter.post('/', domainInsertValidator(), createDomain)
domainRouter.patch('/', domainUpdateValidator(), editDomain)
domainRouter.delete('/:domainName', deleteDomain)

export default domainRouter
