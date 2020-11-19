/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

const CiraConfigRouter = require('express').Router();
const { allCiraConfigs } = require('./all');
const { getCiraConfig } = require('./getCiraConfig');
const { createCiraConfig } = require('./createCiraConfig')
const { editCiraConfig } = require('./editCiraConfig')
const { deleteCiraConfig } = require('./deleteCiraConfig');


CiraConfigRouter.get('/', allCiraConfigs)
CiraConfigRouter.get('/:ciraConfigName', getCiraConfig)
CiraConfigRouter.post('/create', createCiraConfig)
CiraConfigRouter.patch('/edit', editCiraConfig)
CiraConfigRouter.delete('/:ciraConfigName', deleteCiraConfig)

module.exports = CiraConfigRouter;