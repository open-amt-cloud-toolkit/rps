import { IDbCreator } from '../interfaces/IDbCreator'
import { RCSConfig } from '../../models/Rcs'
import { FileHelper } from '../../utils/FileHelper'
import { EnvReader } from '../../utils/EnvReader'
export class ConfigDbCreator implements IDbCreator {
  static instance: any
  config: RCSConfig
  constructor (config: RCSConfig) {
    this.config = config
  }

  getDb (): any {
    return this.readData()
  }

  readData (): any {
    return FileHelper.readJsonObjFromFile(EnvReader.configPath)
  }
}
