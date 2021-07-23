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
import { ciraInsertValidator, ciraUpdateValidator } from './ciraValidator'
import { odataValidator } from '../validator'
const CiraConfigRouter: Router = Router()

CiraConfigRouter.get('/', odataValidator(), allCiraConfigs)
CiraConfigRouter.get('/:ciraConfigName', getCiraConfig)
CiraConfigRouter.post('/', ciraInsertValidator(), createCiraConfig)
CiraConfigRouter.patch('/', ciraUpdateValidator(), editCiraConfig)
CiraConfigRouter.delete('/:ciraConfigName', deleteCiraConfig)

export default CiraConfigRouter
