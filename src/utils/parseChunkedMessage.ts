/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// parses (concatenates) a chunked message
// the input must be well-formed including
// the final character sequence of '0\r\n\r\n'
// returns an empty string on any unexpected values, lengths, or missing data
export function parseChunkedMessage (original: string): string {
  const endMarker = '0\r\n\r\n'
  let parsed = ''
  let indexCur = 0
  let indexNext = original.indexOf(endMarker)
  // must have end of message marker at the end of the string
  if (indexNext === -1 || indexNext !== original.length - endMarker.length) {
    return ''
  }
  while (indexCur < original.length) {
    indexNext = original.indexOf('\r\n', indexCur)
    // because of the previous EOM check,
    // at this point, indexNext will always be valid
    const chunkLenHex = original.substring(indexCur, indexNext)
    if (!chunkLenHex.match(/^[0-9A-Fa-f]+$/)) {
      return ''
    }
    const chunkLenInt = parseInt(chunkLenHex, 16)
    indexCur += chunkLenHex.length + 2
    indexNext = indexCur + chunkLenInt
    // end of string or next chunk marker
    // also prevents indexNext being out of bounds
    if (original.indexOf('\r\n', indexNext) !== indexNext) {
      return ''
    }
    parsed += original.substring(indexCur, indexNext)
    indexCur = indexNext + 2
  }
  return parsed
}
