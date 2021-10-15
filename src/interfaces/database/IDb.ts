import { ICiraConfigTable } from './ICiraConfigDb'
import { IDomainsTable } from './IDomainsDb'
import { IProfilesTable } from './IProfilesDb'
import { IProfilesWifiConfigsTable } from './IProfileWifiConfigsDb'
import { ITlsConfigsTable } from './ITlsConfigsDb'
import { IWirelessProfilesTable } from './IWirelessProfilesDB'

export interface IDB {
  ciraConfigs: ICiraConfigTable
  domains: IDomainsTable
  profiles: IProfilesTable
  wirelessProfiles: IWirelessProfilesTable
  profileWirelessConfigs: IProfilesWifiConfigsTable
  tlsConfigs: ITlsConfigsTable
  query: (text: string, params?: any) => Promise<any>
}
