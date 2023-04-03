/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'
import { getAllIEEE8021xConfigs } from './all'
import { getIEEE8021xProfile, getIEEE8021xCountByInterface } from './get'
import { createIEEE8021xProfile } from './create'
import { deleteIEEE8021xProfile } from './delete'
import { editIEEE8021xProfile } from './edit'
import { ieee8021xValidator, ieee8021xEditValidator } from './ieee8021xValidator'
import { odataValidator } from '../odataValidator'
import validateMiddleware from '../../../middleware/validate'
const ieee8021xProfileRouter: Router = Router()

ieee8021xProfileRouter.get('/', odataValidator(), validateMiddleware, getAllIEEE8021xConfigs)
// Route 'countByInterface' depricates after release 2.9.0
ieee8021xProfileRouter.get('/countByInterface', getIEEE8021xCountByInterface)
ieee8021xProfileRouter.get('/:profileName', getIEEE8021xProfile)
ieee8021xProfileRouter.post('/', ieee8021xValidator(), validateMiddleware, createIEEE8021xProfile)
ieee8021xProfileRouter.patch('/', ieee8021xEditValidator(), validateMiddleware, editIEEE8021xProfile)
ieee8021xProfileRouter.delete('/:profileName', deleteIEEE8021xProfile)

export default ieee8021xProfileRouter
