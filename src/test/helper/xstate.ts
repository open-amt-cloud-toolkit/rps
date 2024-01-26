/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { interpret } from 'xstate'
import { type DoneResponse } from '../../stateMachines/maintenance/doneResponse.js'
import { waitFor } from 'xstate/lib/waitFor.js'

export const runTilDone = async function (machine: any, inputEvent: any, doneResponse: DoneResponse): Promise<any> {
  const actor = interpret(machine)
    .onDone(doneEvent => {
      expect(doneEvent.data).toEqual(expect.objectContaining(doneResponse))
    })
  actor.start()
  actor.send(inputEvent)
  const state = await waitFor(actor, (state) => state.done === true)
  return state.context
}
