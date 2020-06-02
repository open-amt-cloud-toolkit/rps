/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
// ./routes/index.js
import adminRouter = require('./admin/index')
const router = require('express').Router();

router.use('/admin', adminRouter);

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

module.exports = router;