import { RCSConfig } from '../models/Rcs'

export interface webConfigType {
  ca: any
  cert: any
  key: any
  secureOptions?: any
}

interface IEnvReader{
  GlobalEnvConfig: RCSConfig
  configPath: string
}
const EnvReader: IEnvReader = {
  GlobalEnvConfig: null,
  configPath: null
}

export { EnvReader }
