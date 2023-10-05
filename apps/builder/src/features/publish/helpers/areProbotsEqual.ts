import { omit } from '@typebot.io/lib'
import { Probot } from '@typebot.io/schemas'
import { dequal } from 'dequal'

export const areProbotsEqual = (probotA: Probot, probotB: Probot) =>
  dequal(
    JSON.parse(JSON.stringify(omit(probotA, 'updatedAt'))),
    JSON.parse(JSON.stringify(omit(probotB, 'updatedAt')))
  )
