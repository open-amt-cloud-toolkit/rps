/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { Router } from 'express'
import { allProfiles } from './all'
import { getNetProfile } from './getProfile'
import { createNetProfile } from './createNetProfile'
const profileRouter: Router = Router()

profileRouter.get('/', allProfiles)
profileRouter.get('/:profileName', getNetProfile)
profileRouter.post('/create', createNetProfile)

export default profileRouter
