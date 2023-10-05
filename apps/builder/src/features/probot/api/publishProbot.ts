import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { InputBlockType, probotSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import { isWriteProbotForbidden } from '../helpers/isWriteProbotForbidden'
import { sendTelemetryEvents } from '@typebot.io/lib/telemetry/sendTelemetryEvent'
import { Plan } from '@typebot.io/prisma'

export const publishProbot = authenticatedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/probots/{probotId}/publish',
      protect: true,
      summary: 'Publish a probot',
      tags: ['Probot'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
    })
  )
  .output(
    z.object({
      message: z.literal('success'),
    })
  )
  .mutation(async ({ input: { probotId }, ctx: { user } }) => {
    const existingProbot = await prisma.probot.findFirst({
      where: {
        id: probotId,
      },
      include: {
        collaborators: true,
        publishedProbot: true,
        workspace: {
          select: {
            plan: true,
          },
        },
      },
    })
    if (
      !existingProbot?.id ||
      (await isWriteProbotForbidden(existingProbot, user))
    )
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Probot not found' })

    if (existingProbot.workspace.plan === Plan.FREE) {
      const hasFileUploadBlocks = probotSchema._def.schema.shape.groups
        .parse(existingProbot.groups)
        .some((group) =>
          group.blocks.some((block) => block.type === InputBlockType.FILE)
        )

      if (hasFileUploadBlocks)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "File upload blocks can't be published on the free plan",
        })
    }

    if (existingProbot.publishedProbot)
      await prisma.publicProbot.updateMany({
        where: {
          id: existingProbot.publishedProbot.id,
        },
        data: {
          version: existingProbot.version,
          edges: probotSchema._def.schema.shape.edges.parse(
            existingProbot.edges
          ),
          groups: probotSchema._def.schema.shape.groups.parse(
            existingProbot.groups
          ),
          settings: probotSchema._def.schema.shape.settings.parse(
            existingProbot.settings
          ),
          variables: probotSchema._def.schema.shape.variables.parse(
            existingProbot.variables
          ),
          theme: probotSchema._def.schema.shape.theme.parse(
            existingProbot.theme
          ),
        },
      })
    else
      await prisma.publicProbot.createMany({
        data: {
          version: existingProbot.version,
          probotId: existingProbot.id,
          edges: probotSchema._def.schema.shape.edges.parse(
            existingProbot.edges
          ),
          groups: probotSchema._def.schema.shape.groups.parse(
            existingProbot.groups
          ),
          settings: probotSchema._def.schema.shape.settings.parse(
            existingProbot.settings
          ),
          variables: probotSchema._def.schema.shape.variables.parse(
            existingProbot.variables
          ),
          theme: probotSchema._def.schema.shape.theme.parse(
            existingProbot.theme
          ),
        },
      })

    await sendTelemetryEvents([
      {
        name: 'Probot published',
        workspaceId: existingProbot.workspaceId,
        probotId: existingProbot.id,
        userId: user.id,
        data: {
          name: existingProbot.name,
          isFirstPublish: existingProbot.publishedProbot ? undefined : true,
        },
      },
    ])

    return { message: 'success' }
  })
