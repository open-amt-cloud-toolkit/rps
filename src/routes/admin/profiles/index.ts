/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { deleteProfile } from './deleteProfile'

import { Router } from 'express'
import { allProfiles } from './all'
import { getProfile } from './getProfile'
import { createProfile } from './createProfile'
import { editProfile } from './editProfile'
import { amtProfileValidator, profileUpdateValidator } from './amtProfileValidator'
import { odataValidator } from '../odataValidator'
import validateMiddleware from '../../../middleware/validate'
const profileRouter: Router = Router()

profileRouter.get('/', odataValidator(), validateMiddleware, allProfiles)
profileRouter.get('/:profileName', getProfile)
profileRouter.post('/', amtProfileValidator(), validateMiddleware, createProfile)
profileRouter.patch('/', profileUpdateValidator(), validateMiddleware, editProfile)
profileRouter.delete('/:profileName', deleteProfile)

export default profileRouter
