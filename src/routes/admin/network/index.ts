/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { deleteNetProfile } from './deleteNetProfile'

const profileRouter = require('express').Router();
const { allProfiles } = require('./all');
const { getNetProfile } = require('./getProfile');
const { createNetProfile } = require('./createNetProfile')
const { editNetProfile } = require('./editNetProfile')

profileRouter.get('/', allProfiles)
profileRouter.get('/:profileName', getNetProfile)
profileRouter.post('/create', createNetProfile)
profileRouter.patch('/edit', editNetProfile)
profileRouter.delete('/:profileName', deleteNetProfile)

module.exports = profileRouter;