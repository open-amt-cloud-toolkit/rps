/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'

import { getHealthCheck } from './getHealth'
const healthRouter: Router = Router()

healthRouter.get('/', getHealthCheck)

export default healthRouter
