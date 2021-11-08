/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Check status of service dependents
 **********************************************************************/

import { ILogger } from '../interfaces/ILogger'
import { IConfigurator } from '../interfaces/IConfigurator'
import { IProfilesTable } from '../interfaces/database/IProfilesDb'
import { IHealthCheck } from '../interfaces/IHealthCheck'
import { EnvReader } from '../utils/EnvReader'
import { DependencyName, healthCheckError } from '../RCS.Config'
import { POSTGRES_RESPONSE_CODES, VAULT_RESPONSE_CODES } from './constants'

import got from 'got'

export class HealthCheck implements IHealthCheck {
  private readonly amtConfigurations: IProfilesTable
  private readonly logger: ILogger
  private readonly configurator: IConfigurator
  private readonly envConfig: any

  constructor (logger: ILogger, configurator: IConfigurator, amtConfigurations: IProfilesTable, config?: any) {
    this.logger = logger
    this.configurator = configurator
    this.amtConfigurations = amtConfigurations
    this.envConfig = config // This is all Env config stuff
  }

  /**
    * @description Check status of service dependents
    * @returns {healthCheckError} returns the activation to be performed
    */
  public async getHealthCheck (): Promise<healthCheckError[]> {
    const errors: healthCheckError[] = []

    try {
      const vaultHealthResult = await got(`${EnvReader.GlobalEnvConfig.VaultConfig.address}/v1/sys/health`)
      this.logger.verbose(`vault health result: ${vaultHealthResult?.body}`)
    } catch (error) {
      errors.push({ name: DependencyName.VAULT, errorCode: error?.response?.statusCode, error: VAULT_RESPONSE_CODES(error?.response?.statusCode) })
    }

    try {
      const dbCheckResult = await this.amtConfigurations.getCount()
      this.logger.verbose(`db health result: ${dbCheckResult}`)
    } catch (error) {
      errors.push({ name: DependencyName.POSTGRESQL, errorCode: error?.code, error: POSTGRES_RESPONSE_CODES(error?.code) })
    }

    return errors
  }
}
