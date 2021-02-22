/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { Router } from 'express'
import { allProfiles } from './all'
import { getNetProfile } from './getProfile'
import { createNetProfile } from './createNetProfile'
// import { editNetProfile } from './editNetProfile'
import { networkValidator } from './networkValidator'
// import { deleteNetProfile } from './deleteNetProfile'

const profileRouter: Router = Router()

profileRouter.get('/', allProfiles)
profileRouter.get('/:profileName', getNetProfile)
profileRouter.post('/', networkValidator(), createNetProfile)
// profileRouter.patch('/', networkValidator(), editNetProfile)
// profileRouter.delete('/:profileName', deleteNetProfile)

export default profileRouter
