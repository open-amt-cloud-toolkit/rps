/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
// ./routes/index.js
import adminRouter from './admin/index'
import { Router } from 'express'
const router: Router = Router()

router.use('/admin', adminRouter)

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' })
})

module.exports = router
