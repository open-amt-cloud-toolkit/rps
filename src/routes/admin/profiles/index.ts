/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { deleteProfile } from "./deleteProfile";

const profileRouter = require('express').Router();
const {allProfiles }= require('./all');
const {getProfile} = require('./getProfile');
const {createProfile} = require('./createProfile')


profileRouter.get('/', allProfiles)
profileRouter.get('/:profileName', getProfile)
profileRouter.post('/create', createProfile)
profileRouter.delete('/:profileName', deleteProfile)

module.exports = profileRouter;