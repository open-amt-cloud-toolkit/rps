/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
const adminRouter = require('express').Router();
const domains = require('./domains/index');
const profiles = require('./profiles/index');
const ciraConfigs = require('./ciraconfig/index');
const version = require('./version/index');
const networkconfigs = require('./network/index')

adminRouter.use('/domains', domains);
adminRouter.use('/profiles', profiles);
adminRouter.use('/ciraconfigs', ciraConfigs)
adminRouter.use('/networkconfigs', networkconfigs)
adminRouter.use('/version', version)
adminRouter.get('/', (req, res) => {
  res.status(200).json({ message: "admin path. use admin/profiles" })
})
export = adminRouter