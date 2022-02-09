/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Router } from 'express'
import validateMiddleware from '../../../middleware/validate'
import { odataValidator } from '../odataValidator'
import { allProfiles } from './all'
import { createWirelessProfile } from './create'
import { deleteWirelessProfile } from './delete'
import { editWirelessProfile } from './edit'
import { getWirelessProfile } from './get'
import { wirelessValidator, wirelessEditValidator } from './wirelessValidator'

const profileRouter: Router = Router()

profileRouter.get('/', odataValidator(), validateMiddleware, allProfiles)
profileRouter.get('/:profileName', getWirelessProfile)
profileRouter.post('/', wirelessValidator(), validateMiddleware, createWirelessProfile)
profileRouter.patch('/', wirelessEditValidator(), validateMiddleware, editWirelessProfile)
profileRouter.delete('/:profileName', deleteWirelessProfile)
export default profileRouter
