/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const wsmanGenSettingsChunk01 =
  '0220\r\n' +
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<a:Envelope ' +
  'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
  'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
  'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
  'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
  'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
  'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
  'xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_GeneralSettings" ' +
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-ins' +
  '\r\n'

export const wsmanGenSettingsChunk02 =
  '02FA\r\n' +
  'tance">' +
  '<a:Header>' +
  '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
  '<b:RelatesTo>0</b:RelatesTo>' +
  '<b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action>' +
  '<b:MessageID>uuid:00000000-8086-8086-8086-000000000001</b:MessageID>' +
  '<c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_GeneralSettings</c:ResourceURI>' +
  '</a:Header>' +
  '<a:Body>' +
  '<g:AMT_GeneralSettings>' +
  '<g:AMTNetworkEnabled>1</g:AMTNetworkEnabled>' +
  '<g:DDNSPeriodicUpdateInterval>1440</g:DDNSPeriodicUpdateInterval>' +
  '<g:DDNSTTL>900</g:DDNSTTL>' +
  '<g:DDNSUpdateByDHCPServerEnabled>true</g:DDNSUpdateByDHCPServerEnabled>' +
  '<g:DDNSUpdateEnabled>false</g:DDNSUpdateEnabled>' +
  '<g:DHCPv6ConfigurationTimeout>0</g:DHCPv6ConfigurationTimeout>' +
  '<g:DigestRealm>Dige' +
  '\r\n'

export const wsmanGenSettingsChunk03 =
  '02FA\r\n' +
  'st:62FFAC181B3F3457C5B3894ED21F3E6E</g:DigestRealm>' +
  '<g:DomainName></g:DomainName>' +
  '<g:ElementName>Intel(r) AMT: General Settings</g:ElementName>' +
  '<g:HostName></g:HostName>' +
  '<g:HostOSFQDN></g:HostOSFQDN>' +
  '<g:IdleWakeTimeout>1</g:IdleWakeTimeout>' +
  '<g:InstanceID>Intel(r) AMT: General Settings</g:InstanceID>' +
  '<g:NetworkInterfaceEnabled>true</g:NetworkInterfaceEnabled>' +
  '<g:PingResponseEnabled>true</g:PingResponseEnabled>' +
  '<g:PowerSource>0</g:PowerSource>' +
  '<g:PreferredAddressFamily>0</g:PreferredAddressFamily>' +
  '<g:PresenceNotificationInterval>0</g:PresenceNotificationInterval>' +
  '<g:PrivacyLevel>0</g:PrivacyLevel>' +
  '<g:RmcpPingResponseEnabled>true</g:RmcpPingResponseEnabled>' +
  '<g:SharedFQDN>true</g:SharedFQDN>' +
  '<g:ThunderboltDockEnabled>0</g:ThunderboltDockEnabled>' +
  '<g:WsmanOnlyMode>false</g:' +
  '\r\n'

export const wsmanGenSettingsChunk04 =
  '003C\r\n' + 'WsmanOnlyMode></g:AMT_GeneralSettings></a:Body></a:Envelope>' + '\r\n'

export const chunkEndOfMsg = '0\r\n' + '\r\n'

export const wsmanGenSettingsGood =
  wsmanGenSettingsChunk01 + wsmanGenSettingsChunk02 + wsmanGenSettingsChunk03 + wsmanGenSettingsChunk04 + chunkEndOfMsg

export const chunkedHeader200 =
  'HTTP/1.1 200 OK\r\n' +
  'Date: Mon, 31 Jan 2022 10:23:04 GMT\r\n' +
  'Server: Intel(R) Active Management Technology 15.0.23.1706\r\n' +
  'X-Frame-Options: DENY\r\n' +
  'Content-Type: application/soap+xml; charset=UTF-8\r\n' +
  'Transfer-Encoding: chunked\r\n' +
  '\r\n'

export const response200Good = chunkedHeader200 + wsmanGenSettingsGood

export const response200OutOfOrder =
  wsmanGenSettingsChunk03 +
  wsmanGenSettingsChunk04 +
  chunkEndOfMsg +
  chunkedHeader200 +
  wsmanGenSettingsChunk01 +
  wsmanGenSettingsChunk02

export const response200Incomplete = chunkedHeader200 + wsmanGenSettingsChunk01 + wsmanGenSettingsChunk02

export const response200BadWsmanXML = chunkedHeader200 + wsmanGenSettingsChunk01 + chunkEndOfMsg

export const htmlUnauth =
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" >' +
  '<html lang="en">' +
  '<head>' +
  '<link rel=stylesheet href=/styles.css>' +
  '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
  '<title>Intel&reg; Active Management Technology</title>' +
  '</head>' +
  '<body>' +
  '<h1>Intel<sup>&reg;</sup> Active Management Technology</h1>' +
  '<h2 class=warn>Log on failed. Incorrect user name or password, or user account temporarily locked.</h2>' +
  '</body>' +
  '</html>'

export const response401 = [
  'HTTP/1.1 401 Unauthorized',
  'WWW-Authenticate: Digest realm="Digest:727734D63A1FC0423736E48DA554E462", nonce="B9AX94iAAAAAAAAAx6rrSfPHGUrx/3uA",stale="false",qop="auth"',
  'Content-Type: text/html',
  'Server: Intel(R) Active Management Technology 15.0.23.1706',
  `Content-Length: ${htmlUnauth.length}`,
  'Connection: close',
  '',
  htmlUnauth
].join('\r\n')

export const htmlBadRequest =
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" >' +
  '<html lang="en">' +
  '<head>' +
  '<link rel=stylesheet href=/styles.css>' +
  '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
  '<title>Intel&reg; Active Management Technology</title>' +
  '</head>' +
  '<body>' +
  '<h1>Intel<sup>&reg;</sup> Active Management Technology</h1>' +
  '<h2 class=warn>Bad Request. Missing required parameter "TESTING"</h2>' +
  '</body>' +
  '</html>'

export const response400 = [
  'HTTP/1.1 400 Bad Request',
  'Content-Type: text/html',
  'Server: Intel(R) Active Management Technology 15.0.23.1706',
  `Content-Length: ${htmlBadRequest.length}`,
  'Connection: close',
  '',
  htmlBadRequest
].join('\r\n')

/**
 * 'HTTP/1.1 400 Bad Request\r\n' +
  'Date: Fri, 17 Feb 2023 22:57:41 GMT\r\n' +
  'Server: Intel(R) Active Management Technology 15.0.23.1706\r\n' +
  'X-Frame-Options: DENY\r\n' +
  'Content-Type: application/soap+xml; charset=UTF-8\r\n' +
  'Transfer-Encoding: chunked\r\n' +
  'Connection: close\r\n\r\n' +

 */
export const wsmanAlreadyExistsAllChunks =
  '04CC\r\n' +
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<a:Envelope ' +
  'xmlns:g="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
  'xmlns:f="http://schemas.xmlsoap.org/ws/2004/08/eventing" ' +
  'xmlns:e="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
  'xmlns:d="http://schemas.xmlsoap.org/ws/2004/09/transfer" ' +
  'xmlns:c="http://schemas.xmlsoap.org/ws/2004/09/enumeration" ' +
  'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
  'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
  'xmlns:h="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
  'xmlns:i="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
  'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
  '<a:Header>' +
  '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
  '<b:RelatesTo>31</b:RelatesTo>' +
  '<b:Action a:mustUnderstand="true">http://schemas.dmtf.org/wbem/wsman/1/wsman/fault</b:Action>' +
  '<b:MessageID>uuid:00000000-8086-8086-8086-000000023EEF</b:MessageID>' +
  '</a:Header>' +
  '<a:Body>' +
  '<a:Fault>' +
  '<a:Code>' +
  '<a:Value>a:Sender</a:Value>' +
  '<a:Subcode>' +
  '<a:Value>e:AlreadyExists</a:Value>' +
  '</a:Subcode>' +
  '</a:Code>' +
  '<a:Reason>' +
  '<a:Text xml:lang="en-US">The sender attempted to create a resource which already exists.</a:Text>' +
  '</a:Reason>' +
  '<a:Detail></a:Detail>' +
  '</a:Fault>' +
  '</a:Body>' +
  '</a:Envelope>\r\n' +
  '0\r\n\r\n'
