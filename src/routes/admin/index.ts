/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router, type Request, type Response } from 'express'
import domains from './domains/index'
import profiles from './profiles/index'
import ciraConfigs from './ciraconfig/index'
import version from './version/index'
import wirelessconfigs from './wireless/index'
import health from './health/index'

const adminRouter: Router = Router()

adminRouter.use('/domains', domains)
adminRouter.use('/profiles', profiles)
adminRouter.use('/ciraconfigs', ciraConfigs)
adminRouter.use('/wirelessconfigs', wirelessconfigs)
adminRouter.use('/version', version)
adminRouter.use('/health', health)
adminRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'admin path. use admin/profiles' })
})
export default adminRouter
