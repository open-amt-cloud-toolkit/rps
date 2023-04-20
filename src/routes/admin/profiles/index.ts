/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { deleteProfile } from './delete'

import { Router } from 'express'
import { allProfiles } from './all'
import { getProfile } from './get'
import { createProfile } from './create'
import { editProfile } from './edit'
import { amtProfileValidator, profileUpdateValidator } from './amtProfileValidator'
import { odataValidator } from '../odataValidator'
import validateMiddleware from '../../../middleware/validate'
import ifMatchMiddleware from '../../../middleware/if-match'
const profileRouter: Router = Router()

profileRouter.get('/', odataValidator(), validateMiddleware, allProfiles)
profileRouter.get('/:profileName', getProfile)
profileRouter.post('/', amtProfileValidator(), validateMiddleware, createProfile)
profileRouter.patch('/', profileUpdateValidator(), validateMiddleware, ifMatchMiddleware, editProfile)
profileRouter.delete('/:profileName', validateMiddleware, deleteProfile)

export default profileRouter
