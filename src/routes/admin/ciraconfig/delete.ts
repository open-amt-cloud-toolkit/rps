/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import handleError from '../../../utils/handleError'

export async function deleteCiraConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteCiraConfig')
  const ciraConfigName: string = req.params.ciraConfigName
  try {
    const result: boolean = await req.db.ciraConfigs.delete(ciraConfigName)
    if (result) {
      if (req.secretsManager) {
        await req.secretsManager.deleteSecretWithPath(`CIRAConfigs/${ciraConfigName}`)
      }
      MqttProvider.publishEvent('success', ['deleteCiraConfig'], `Deleted CIRA config : ${ciraConfigName}`)
      log.verbose(`Deleted CIRA config profile : ${ciraConfigName}`)
      res.status(204).end()
    } else {
      throw new RPSError(NOT_FOUND_MESSAGE('CIRA', ciraConfigName), NOT_FOUND_EXCEPTION)
    }
  } catch (error) {
    handleError(log, ciraConfigName, req, res, error)
  }
}
