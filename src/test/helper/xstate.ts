/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createActor, waitFor } from 'xstate'
import { type DoneResponse } from '../../stateMachines/maintenance/doneResponse.js'

export const runTilDone = async function (machine: any, inputEvent: any, doneResponse: DoneResponse, context: any, done: any): Promise<any> {
  const actor = createActor(machine, ({ input: context }))
  actor.subscribe(doneEvent => {
    if (doneEvent.status === 'done') {
      expect(doneEvent.output).toEqual(expect.objectContaining(doneResponse))
      done()
    }
  })
  actor.start()
  actor.send(inputEvent)
  const state = await waitFor(actor, (state) => state.status === 'done')
  return state.context
}
