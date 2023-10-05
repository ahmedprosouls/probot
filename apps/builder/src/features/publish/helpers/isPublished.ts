import { Probot, PublicProbot } from '@typebot.io/schemas'
import { diff } from 'deep-object-diff'
import { dequal } from 'dequal'

export const isPublished = (
  probot: Probot,
  publicProbot: PublicProbot,
  debug?: boolean
) => {
  if (debug)
    console.log(
      diff(
        JSON.parse(JSON.stringify(probot.groups)),
        JSON.parse(JSON.stringify(publicProbot.groups))
      )
    )
  return (
    dequal(
      JSON.parse(JSON.stringify(probot.groups)),
      JSON.parse(JSON.stringify(publicProbot.groups))
    ) &&
    dequal(
      JSON.parse(JSON.stringify(probot.settings)),
      JSON.parse(JSON.stringify(publicProbot.settings))
    ) &&
    dequal(
      JSON.parse(JSON.stringify(probot.theme)),
      JSON.parse(JSON.stringify(publicProbot.theme))
    ) &&
    dequal(
      JSON.parse(JSON.stringify(probot.variables)),
      JSON.parse(JSON.stringify(publicProbot.variables))
    )
  )
}
