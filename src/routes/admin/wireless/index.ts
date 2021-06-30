/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Router } from 'express'
import { allProfiles } from './all'
import { createWirelessProfile } from './createWirelessProfile'
import { deleteWirelessProfile } from './deleteProfile'
import { editWirelessProfile } from './editProfile'
import { getWirelessProfile } from './getProfile'
import { wirelessValidator, wirelessEditValidator } from './wirelessValidator'

const profileRouter: Router = Router()

profileRouter.get('/', allProfiles)
profileRouter.get('/:profileName', getWirelessProfile)
profileRouter.post('/', wirelessValidator(), createWirelessProfile)
profileRouter.patch('/', wirelessEditValidator(), editWirelessProfile)
profileRouter.delete('/:profileName', deleteWirelessProfile)
export default profileRouter
