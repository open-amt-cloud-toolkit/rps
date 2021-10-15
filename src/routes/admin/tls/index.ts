/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Router } from 'express'
import { allTlsConfigs } from './all'
import { getTlsConfig } from './getTlsConfig'
import { createTlsConfig } from './createTlsConfig'
import { editTlsConfig } from './editTlsConfig'
import { deleteTlsConfig } from './deleteTlsConfig'
import { tlsInsertValidator, tlsUpdateValidator } from './tlsConfigValidator'
import { odataValidator } from '../odataValidator'
import validateMiddleware from '../../../middleware/validate'
const TlsConfigRouter: Router = Router()

TlsConfigRouter.get('/', odataValidator(), validateMiddleware, allTlsConfigs)
TlsConfigRouter.get('/:configName', getTlsConfig)
TlsConfigRouter.post('/', tlsInsertValidator(), validateMiddleware, createTlsConfig)
TlsConfigRouter.patch('/', tlsUpdateValidator(), validateMiddleware, editTlsConfig)
TlsConfigRouter.delete('/:configName', deleteTlsConfig)

export default TlsConfigRouter
