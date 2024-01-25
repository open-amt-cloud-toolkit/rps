/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'
import validateMiddleware from '../../../middleware/validate.js'
import { odataValidator } from '../odataValidator.js'
import { allProfiles } from './all.js'
import { createWirelessProfile } from './create.js'
import { deleteWirelessProfile } from './delete.js'
import { editWirelessProfile } from './edit.js'
import { getWirelessProfile } from './get.js'
import { wirelessValidator, wirelessEditValidator } from './wirelessValidator.js'

const profileRouter: Router = Router()

profileRouter.get('/', odataValidator(), validateMiddleware, allProfiles)
profileRouter.get('/:profileName', getWirelessProfile)
profileRouter.post('/', wirelessValidator(), validateMiddleware, createWirelessProfile)
profileRouter.patch('/', wirelessEditValidator(), validateMiddleware, editWirelessProfile)
profileRouter.delete('/:profileName', deleteWirelessProfile)
export default profileRouter
