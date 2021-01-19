/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Brian Osburn
 **********************************************************************/

import { Router } from 'express'

import { getVersion } from './getVersion'
const profileRouter: Router = Router()

profileRouter.get('/', getVersion)

export default profileRouter
