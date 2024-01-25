/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'
import { allCiraConfigs } from './all.js'
import { getCiraConfig } from './get.js'
import { createCiraConfig } from './create.js'
import { editCiraConfig } from './edit.js'
import { deleteCiraConfig } from './delete.js'
import { ciraInsertValidator, ciraUpdateValidator } from './ciraValidator.js'
import { odataValidator } from '../odataValidator.js'
import validateMiddleware from '../../../middleware/validate.js'
// import etagMiddleware from '../../../middleware/etag.js'
import ifMatchMiddleware from '../../../middleware/if-match.js'
const CiraConfigRouter: Router = Router()

CiraConfigRouter.get('/', odataValidator(), validateMiddleware, allCiraConfigs)
CiraConfigRouter.get('/:ciraConfigName', getCiraConfig)
CiraConfigRouter.post('/', ciraInsertValidator(), validateMiddleware, createCiraConfig)
CiraConfigRouter.patch('/', ciraUpdateValidator(), validateMiddleware, ifMatchMiddleware, editCiraConfig)
CiraConfigRouter.delete('/:ciraConfigName', deleteCiraConfig)

export default CiraConfigRouter
