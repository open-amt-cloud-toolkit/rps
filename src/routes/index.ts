/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// ./routes/index.js
import adminRouter from './admin/index'
import { Router, Request, Response } from 'express'

const router: Router = Router()

const tenantMiddleware = (req: Request, res: Response, next): void => {
  req.tenantId = req.headers['x-tenant-id'] as string ?? ''
  req.next()
}

router.use('/admin', tenantMiddleware, adminRouter)

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Connected!' })
})

export default router
