/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'
import { getAllIEEE8021xConfigs } from './all.js'
import { getIEEE8021xProfile } from './get.js'
import { createIEEE8021xProfile } from './create.js'
import { deleteIEEE8021xProfile } from './delete.js'
import { editIEEE8021xProfile } from './edit.js'
import { ieee8021xValidator, ieee8021xEditValidator } from './ieee8021xValidator.js'
import { odataValidator } from '../odataValidator.js'
import validateMiddleware from '../../../middleware/validate.js'
const ieee8021xProfileRouter: Router = Router()

ieee8021xProfileRouter.get('/', odataValidator(), validateMiddleware, getAllIEEE8021xConfigs)
ieee8021xProfileRouter.get('/:profileName', getIEEE8021xProfile)
ieee8021xProfileRouter.post('/', ieee8021xValidator(), validateMiddleware, createIEEE8021xProfile)
ieee8021xProfileRouter.patch('/', ieee8021xEditValidator(), validateMiddleware, editIEEE8021xProfile)
ieee8021xProfileRouter.delete('/:profileName', deleteIEEE8021xProfile)

export default ieee8021xProfileRouter
