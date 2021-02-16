/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import { apiResponse } from '../RCS.Config'

export const AMTRandomPasswordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()'

export const AppVersion = '1.0.0'
export const ProtocolVersion = '3.0.0'
export const AMTUserName = 'admin'
export const mpsserver = (name: string): string => {
  return `<Address xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</Address><ReferenceParameters xmlns="http://schemas.xmlsoap.org/ws/2004/08/addressing"><ResourceURI xmlns="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP</ResourceURI><SelectorSet xmlns="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd"><Selector Name="Name">${name}</Selector></SelectorSet></ReferenceParameters>`
}

// Profile API
export const PROFILE_NOT_FOUND = (profileName: string): string => `Profile ${profileName} not found`
export const PROFILE_INSERTION_SUCCESS = (profileName: string): string => `Profile ${profileName} successfully created`
export const PROFILE_INSERTION_FAILED_DUPLICATE = (profileName: string): string => `AMT profile ${profileName} already exists`
export const PROFILE_INSERTION_CIRA_CONSTRAINT = (config: string): string => `Referenced config ${config} doesn't exist`
export const PROFILE_INSERTION_NETWORK_CONSTRAINT = (config: string): string => `Referenced network ${config} doesn't exist`

// CIRA REST API
export const CIRA_CONFIG_NOT_FOUND = (ciraConfig: string): string => `CIRA Config ${ciraConfig} not found`
export const CIRA_CONFIG_DELETION_FAILED_CONSTRAINT = (ciraConfig: string): string => `CIRA Config: ${ciraConfig} associated with an AMT profile`
export const CIRA_CONFIG_INSERTION_SUCCESS = (ciraConfig: string): string => `CIRA Config ${ciraConfig} created`
export const CIRA_CONFIG_INSERTION_FAILED = (ciraConfig: string): string => `CIRA Config insertion failed for ${ciraConfig}`
export const CIRA_CONFIG_INSERTION_FAILED_DUPLICATE = (ciraConfig: string): string => `CIRA Config ${ciraConfig} already exists.`

// Network configs REST API
export const NETWORK_CONFIG_NOT_FOUND = (networkConfig: string): string => `NETWORK Config ${networkConfig} not found`
export const NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT = (networkConfig: string): string => `NETWORK Config: ${networkConfig} is associated with an AMT Profile.`
export const NETWORK_CONFIG_ERROR = (networkConfig: string): string => `Operation failed for NETWORK Config: ${networkConfig}`
export const NETWORK_UPDATE_ERROR = (networkConfig: string): string => `Operation failed for NETWORK Config: ${networkConfig}. Cannot Update Network settings if its already associated with a profile.`
export const NETWORK_CONFIG_INSERTION_SUCCESS = (networkConfig: string): string => `NETWORK Config ${networkConfig} created`
export const NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE = (networkConfig: string): string => `NETWORK Config ${networkConfig} already exists`

// Domain REST API
export const DOMAIN_NOT_FOUND = (domain: string): string => `Domain ${domain} not found`
export const DOMAIN_INSERTION_SUCCESS = (domain: string): string => `Domain ${domain} created`
export const DUPLICATE_DOMAIN_FAILED = (message: string): string => `Domain ${message} ID or Suffix already exists`

// Generic REST API Error Message
export const API_UNEXPECTED_EXCEPTION = (messsage: string): string => `Operation failed: ${messsage}`

// JSON response
export const API_RESPONSE = (data?: any, error?: string, message?: string): apiResponse => {
  const response: apiResponse = {}
  if (error != null) {
    response.error = error
  } else if (data != null) {
    return data
  }
  if (message != null) {
    response.message = message
  }
  return response
}
