/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Brian Osburn
 **********************************************************************/

const profileRouter = require('express').Router()
const { getVersion } = require('./getVersion')

profileRouter.get('/', getVersion)

module.exports = profileRouter
