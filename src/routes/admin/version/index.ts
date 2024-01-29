/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'

import { getVersion } from './get.js'
const profileRouter: Router = Router()

profileRouter.get('/', getVersion)

export default profileRouter
