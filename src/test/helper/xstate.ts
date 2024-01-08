/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AnyStateMachine, type DefaultContext, type EventObject, createActor } from 'xstate'
import { type DoneResponse } from '../../stateMachines/maintenance/doneResponse'
import { waitFor } from 'xstate/lib/waitFor'

export const runTilDone =
  async function <M extends AnyStateMachine, E extends EventObject, C extends DefaultContext>
  (machine: M, inputEvent: E, doneResponse: DoneResponse): Promise<C> {
    const actor = createActor(machine)
    // .onDone(doneEvent => {
    //   expect(doneEvent.data).toEqual(expect.objectContaining(doneResponse))
    // })
    actor.start()
    actor.send(inputEvent)
    const state = await waitFor(actor, (state) => state.done)
    return state.context
  }
