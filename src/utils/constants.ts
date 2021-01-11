/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

export const AMTRandomPasswordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()'

export const AppVersion = '1.0.0'
export const ProtocolVersion = '3.0.0'
export const AMTUserName = 'admin'
export const mpsserver = (name: string) => {
  return `<Address xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</Address><ReferenceParameters xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing"><ResourceURI xmlns="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP</ResourceURI><SelectorSet xmlns="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd"><Selector Name="Name">${name}</Selector></SelectorSet></ReferenceParameters>`
}

// Profile API
export const PROFILE_NOT_FOUND = (profileName) => `Profile ${profileName} not found`
export const PROFILE_CONFIG_EMPTY = 'No profiles found.'
export const PROFILE_SUCCESSFULLY_DELETED = (profileName) => `Profile ${profileName} successfully deleted`
export const PROFILE_DELETION_FAILED = (profileName) => `Deletion failed for profile: ${profileName}`
export const PROFILE_ERROR = (profileName) => `Operation failed for profile: ${profileName}`
export const PROFILE_INSERTION_SUCCESS = (profileName) => `Profile ${profileName} successfully inserted`
export const PROFILE_UPDATE_SUCCESS = (profileName) => `Profile ${profileName} successfully updated`
export const PROFILE_INSERTION_FAILED = (profileName) => `Profile insertion failed for ${profileName} `
export const PROFILE_INSERTION_FAILED_DUPLICATE = (profileName) => `Profile insertion failed for ${profileName}. Profile already exists. `
export const PROFILE_INSERTION_CIRA_CONSTRAINT = (ciraConfig) => `Referenced CIRA Config / Network Config (${ciraConfig}) doesn't exist.`
export const PROFILE_INVALID_INPUT = 'Invalid input. Check input and try again.'
export const PROFILE_INVALID_INPUT_AMT_PASSWORD = 'Invalid AMT Password. Check input and try again.'
export const PROFILE_INVALID_INPUT_MEBX_PASSWORD = 'Invalid MEBx Password. Check input and try again.'
export const PROFILE_INVALID_AMT_PASSWORD_SELECTION = 'Choose either to generate random AMT password or static AMT password.'
export const PROFILE_INVALID_MEBX_PASSWORD_SELECTION = 'Choose either to generate random MEBX password or static MEBX password.'
export const PROFILE_INVALID_AMT_PASSWORD_LENGTH = 'AMT random password length should be between 8 and 32'
export const PROFILE_INVALID_MEBX_PASSWORD_LENGTH = 'MEBx random password length should be between 8 and 32'
export const PROFILE_MEBX_MANDATORY = 'MEBx password is manadatory for admin control mode'

// CIRA REST API
export const CIRA_CONFIG_NOT_FOUND = (ciraConfig) => `CIRA Config ${ciraConfig} not found`
export const CIRA_CONFIG_EMPTY = 'No CIRA Configs found'
export const CIRA_CONFIG_SUCCESSFULLY_DELETED = (ciraConfig) => `CIRA Config ${ciraConfig} successfully deleted`
export const CIRA_CONFIG_DELETION_FAILED = (ciraConfig) => `Deletion failed for CIRA Config: ${ciraConfig}`
export const CIRA_CONFIG_DELETION_FAILED_CONSTRAINT = (ciraConfig) => `Deletion failed for CIRA Config: ${ciraConfig}. Profile associated with this Config.`
export const CIRA_CONFIG_ERROR = (ciraConfig) => `Operation failed for CIRA Config: ${ciraConfig}`
export const CIRA_CONFIG_UPDATE_SUCCESS = (ciraConfig) => `UPDATE Successful for CIRA Config: ${ciraConfig}`
export const CIRA_CONFIG_INSERTION_SUCCESS = (ciraConfig) => `CIRA Config ${ciraConfig} successfully inserted`
export const CIRA_CONFIG_INSERTION_FAILED = (ciraConfig) => `CIRA Config insertion failed for ${ciraConfig}`
export const CIRA_CONFIG_INSERTION_FAILED_DUPLICATE = (ciraConfig) => `CIRA Config insertion failed for ${ciraConfig}. CIRA Config already exists.`

// Network configs REST API
export const NETWORK_CONFIG_NOT_FOUND = (networkConfig) => `NETWORK Config ${networkConfig} not found`
export const NETWORK_CONFIG_EMPTY = 'No NETWORK Configs found'
export const NETWORK_CONFIG_SUCCESSFULLY_DELETED = (networkConfig) => `NETWORK Config ${networkConfig} successfully deleted`
export const NETWORK_CONFIG_DELETION_FAILED = (networkConfig) => `Deletion failed for NETWORK Config: ${networkConfig}`
export const NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT = (networkConfig) => `Deletion failed for NETWORK Config: ${networkConfig}. Profile associated with this Config.`
export const NETWORK_CONFIG_ERROR = (networkConfig) => `Operation failed for NETWORK Config: ${networkConfig}`
export const NETWORK_UPDATE_ERROR = (networkConfig) => `Operation failed for NETWORK Config: ${networkConfig}. Cannot Update Network settings if its already associated with a profile.`
export const NETWORK_CONFIG_UPDATE_SUCCESS = (networkConfig) => `UPDATE Successful for NETWORK Config: ${networkConfig}`
export const NETWORK_CONFIG_INSERTION_SUCCESS = (networkConfig) => `NETWORK Config ${networkConfig} successfully inserted`
export const NETWORK_CONFIG_INSERTION_FAILED = (networkConfig) => `NETWORK Config insertion failed for ${networkConfig}`
export const NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE = (networkConfig) => `NETWORK Config insertion failed for ${networkConfig}. NETWORK Config already exists.`
export const NETWORK_CONFIG_INVALID_INPUT = 'Invalid Network Profile input. Check input and try again.'

// Domain REST API
export const DOMAIN_NOT_FOUND = (domain) => `Domain ${domain} not found`
export const DOMAIN_CONFIG_EMPTY = 'No Domains found'
export const DOMAIN_SUCCESSFULLY_DELETED = (domain) => `Domain ${domain} successfully deleted`
export const DOMAIN_SUCCESSFULLY_UPDATED = (domain) => `Domain ${domain} successfully updated`
export const DOMAIN_DELETION_FAILED = (domain) => `Deletion failed for Domain: ${domain}`
export const DOMAIN_ERROR = (domain) => `Operation failed for Domain: ${domain}`
export const DOMAIN_INSERTION_SUCCESS = (domain) => `Domain ${domain} successfully inserted`
export const DOMAIN_INSERTION_FAILED = (domain) => `Domain insertion failed for ${domain}`
export const DOMAIN_INSERTION_FAILED_DUPLICATE = (domain) => `Domain insertion failed for ${domain}. Domain ID or Domain Suffix already exists.`
