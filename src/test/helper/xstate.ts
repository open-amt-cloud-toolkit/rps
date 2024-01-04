/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AnyStateMachine, type DefaultContext, type EventObject, interpret } from 'xstate'
import { type DoneResponse } from '../../stateMachines/maintenance/doneResponse.js'
import { waitFor } from 'xstate/lib/waitFor.js'

export const runTilDone =
  async function <M extends AnyStateMachine, E extends EventObject, C extends DefaultContext>
  (machine: M, inputEvent: E, doneResponse: DoneResponse): Promise<C> {
    const actor = interpret(machine)
      .onDone(doneEvent => {
        expect(doneEvent.data).toEqual(expect.objectContaining(doneResponse))
      })
    actor.start()
    actor.send(inputEvent)
    const state = await waitFor(actor, (state) => state.done)
    return state.context
  }
