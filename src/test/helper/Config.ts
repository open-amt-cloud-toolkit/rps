import { RPSConfig } from '../../models'

export const config: RPSConfig = {
  VaultConfig: {
    usevault: false,
    SecretsPath: 'secret/data/',
    token: '',
    address: 'http://localhost:8200'
  },
  amtusername: 'admin',
  webport: 8081,
  credentialspath: '../../../MPS_MicroService/private/data.json',
  corsHeaders: '*',
  corsMethods: '*',
  corsOrigin: '*',
  mpsServer: 'https://localhost:3000',
  delayTimer: 12,
  WSConfiguration: {
    WebSocketPort: 8080
  },
  dbProvider: 'postgres',
  connectionString: 'postgresql://postgresadmin:admin123@localhost:5432/rpsdb'
}
