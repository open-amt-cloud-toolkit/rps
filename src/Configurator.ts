/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/

import { IDomainCredentialManager } from "./interfaces/IDomainCredentialManager";
import { IProfileManager } from "./interfaces/IProfileManager";
import { IConfigurator } from "./interfaces/IConfigurator";
import { ILogger } from './interfaces/ILogger';
import { DomainCredentialManager } from "./DomainCredentialManager";
import { ProfileManager } from "./ProfileManager";
import Logger from "./Logger";
import { ISecretManagerService } from "./interfaces/ISecretManagerService";
import { ProfilesDbFactory } from "./repositories/ProfilesDbFactory";
import { DomainsDbFactory } from "./repositories/DomainsDbFactory";
import { IAMTDeviceWriter } from "./repositories/interfaces/IAMTDeviceWriter";
import { SecretManagerService } from "./utils/SecretManagerService";
import { AmtDeviceWriterFactory } from "./repositories/AmtDeviceFactory";
import { EnvReader } from "./utils/EnvReader";
import { NodeForge } from "./NodeForge";
import { IClientManager } from "./interfaces/IClientManager";
import { ClientManager } from "./ClientManager";
import { ClientResponseMsg } from "./utils/ClientResponseMsg";
import { IValidator } from "./interfaces/IValidator";
import { Validator } from "./Validator";
import { WSManProcessor } from "./WSManProcessor";
import { CertManager } from "./CertManager";
import { SignatureHelper } from "./utils/SignatureHelper";
import { DataProcessor } from "./DataProcessor";
import { IDataProcessor } from "./interfaces/IDataProcessor";

export class Configurator implements IConfigurator {

    private _amtDeviceWriter: IAMTDeviceWriter;
    get amtDeviceWriter(): IAMTDeviceWriter {
        return this._amtDeviceWriter;
    }

    private _domainCredentialManager: IDomainCredentialManager;
    get domainCredentialManager(): IDomainCredentialManager {
        return this._domainCredentialManager;
    }

    private _profileManager: IProfileManager;
    get profileManager(): IProfileManager {
        return this._profileManager;
    }

    private _secretManager: ISecretManagerService;
    get secretsManager(): ISecretManagerService {
        return this._secretManager;
    }

    private _dataProcessor: DataProcessor;
    get dataProcessor(): IDataProcessor {
        return this._dataProcessor;
    }

    private _clientManager: IClientManager;
    get clientManager(): IClientManager {
        return this._clientManager;
    }


    constructor() {
        if (EnvReader.GlobalEnvConfig.VaultConfig.usevault) {
            this._secretManager = new SecretManagerService(Logger("SecretManagerService"));          
        }

        let nodeForge = new NodeForge();
        this._clientManager = ClientManager.getInstance(Logger('ClientManager'));
        let responseMsg: ClientResponseMsg = new ClientResponseMsg(Logger('ClientResponseMsg'), nodeForge);
        let validator: IValidator = new Validator(Logger('Validator'), this, this._clientManager, nodeForge);
        let amtwsman: WSManProcessor = new WSManProcessor(Logger(`WSManProcessor`), this._clientManager, responseMsg);
        let certManager = new CertManager(nodeForge);
        let helper = new SignatureHelper(nodeForge);

        this._dataProcessor = new DataProcessor(Logger(`DataProcessor`), helper, this, validator, certManager, this._clientManager, responseMsg, amtwsman);

        this._amtDeviceWriter = AmtDeviceWriterFactory.getAmtDeviceWriter(this);
        this._domainCredentialManager = new DomainCredentialManager(Logger(`DomainCredentialManager`), DomainsDbFactory.getDomainsDb(), this);
        this._profileManager = new ProfileManager(Logger(`ProfileManager`), this, ProfilesDbFactory.getProfilesDb(), EnvReader.GlobalEnvConfig);
    }
}