import { RCSConfig } from '../models/Rcs'

export interface webConfigType {
  ca: any
  cert: any
  key: any
  secureOptions?: any
}

interface IEnvReader{
  GlobalEnvConfig: RCSConfig
}
const EnvReader: IEnvReader = {
  GlobalEnvConfig: null
}

export { EnvReader }
