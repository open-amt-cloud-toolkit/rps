/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { parseChunkedMessage } from './parseChunkedMessage'
import { wsmanGenSettingsGood } from '../test/helper/AMTMessages'

describe('parsing chunked messages', () => {
  const msg1 = 'This is a basic message 01\n.'
  const msg2 = 'This is a longer message 02\r.'
  const msg3 = 'This is a longer message\r\n with embedded \r\n i.e. certificates.\r\n'

  it('should pass with a full wsman message payload', () => {
    const result = parseChunkedMessage(wsmanGenSettingsGood)
    expect(result).toBeTruthy()
  })
  it('should pass with tricky message', () => {
    const chunked = [
      msg1.length.toString(16),
      msg1,
      msg2.length.toString(16),
      msg2,
      msg3.length.toString(16),
      msg3,
      '0',
      '\r\n'
    ].join('\r\n')
    const result = parseChunkedMessage(chunked)
    expect(result).toEqual(msg1 + msg2 + msg3)
  })
  it('should return empty if message is empty', () => {
    const chunked = ''
    const result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()
  })
  it('should return empty if chunk and message lengths do not match', () => {
    // chunk size more than actual message chunk length
    let chunkSize = msg1.length + 3
    let chunked = [
      chunkSize.toString(16),
      msg1,
      '0',
      '\r\n'
    ].join('\r\n')
    let result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()

    // chunk size less than actual message chunk length
    chunkSize = msg1.length - 3
    chunked = [
      chunkSize.toString(16),
      msg1,
      '0',
      '\r\n'
    ].join('\r\n')
    result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()
  })
  it('should return empty if missing end of message marker', () => {
    const chunked = [
      msg1.length.toString(16),
      msg1,
      '\r\n'
    ].join('\r\n')
    const result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()
  })
  it('should return empty with trailing garbage', () => {
    const chunked = [
      msg1.length.toString(16),
      msg1,
      msg2.length.toString(16),
      msg2,
      '0',
      '\r\n' +
      'thisisbadextradata'
    ].join('\r\n')
    const result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()
  })
  it('should return empty if chunk size is not a hex value', () => {
    let chunked = [
      msg1.length.toString(16),
      msg1,
      '123ABCthisisnotgood',
      msg2,
      '0',
      '\r\n'
    ].join('\r\n')
    let result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()

    chunked = [
      msg1.length.toString(16),
      msg1,
      '',
      msg2,
      '0',
      '\r\n'
    ].join('\r\n')
    result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()

    chunked = [
      msg1.length.toString(16),
      msg1,
      msg2,
      '0',
      '\r\n'
    ].join('\r\n')
    result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()
  })
  it('should return empty if chunk size message is empty', () => {
    const chunked = ''
    const result = parseChunkedMessage(chunked)
    expect(result).toBeFalsy()
  })
})
