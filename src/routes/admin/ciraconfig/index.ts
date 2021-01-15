/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { Router } from 'express'
import { allCiraConfigs } from './all'
import { getCiraConfig } from './getCiraConfig'
import { createCiraConfig } from './createCiraConfig'
import { editCiraConfig } from './editCiraConfig'
import { deleteCiraConfig } from './deleteCiraConfig'
const CiraConfigRouter: Router = Router()

CiraConfigRouter.get('/', allCiraConfigs)
CiraConfigRouter.get('/:ciraConfigName', getCiraConfig)
CiraConfigRouter.post('/create', createCiraConfig)
CiraConfigRouter.patch('/edit', editCiraConfig)
CiraConfigRouter.delete('/:ciraConfigName', deleteCiraConfig)

module.exports = CiraConfigRouter
