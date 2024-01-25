/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// ./routes/index.js
import adminRouter from './admin/index.js'
import { Router } from 'express'

const router: Router = Router()

router.use('/admin', adminRouter)

export default router
