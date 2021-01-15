/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { Router } from 'express'
const adminRouter: Router = Router()
import domains = require('./domains/index')
import profiles = require('./profiles/index')
import ciraConfigs = require('./ciraconfig/index')
import version = require('./version/index')
import networkconfigs = require('./network/index')

adminRouter.use('/domains', domains)
adminRouter.use('/profiles', profiles)
adminRouter.use('/ciraconfigs', ciraConfigs)
adminRouter.use('/networkconfigs', networkconfigs)
adminRouter.use('/version', version)
adminRouter.get('/', (req, res) => {
  res.status(200).json({ message: 'admin path. use admin/profiles' })
})
export = adminRouter
