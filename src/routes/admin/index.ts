/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { Router } from 'express'
const adminRouter: Router = Router()
import domains from './domains/index'
import profiles from './profiles/index'
import ciraConfigs from './ciraconfig/index'
import version from './version/index'
import networkconfigs from './network/index'

adminRouter.use('/domains', domains)
adminRouter.use('/profiles', profiles)
adminRouter.use('/ciraconfigs', ciraConfigs)
adminRouter.use('/networkconfigs', networkconfigs)
adminRouter.use('/version', version)
adminRouter.get('/', (req, res) => {
  res.status(200).json({ message: 'admin path. use admin/profiles' })
})
export default adminRouter
