import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { Plan, WorkspaceRole } from '@typebot.io/prisma'
import {
  defaultSettings,
  defaultTheme,
  probotCreateSchema,
  probotSchema,
} from '@typebot.io/schemas'
import { z } from 'zod'
import { getUserRoleInWorkspace } from '@/features/workspace/helpers/getUserRoleInWorkspace'
import {
  isCustomDomainNotAvailable,
  isPublicIdNotAvailable,
  sanitizeGroups,
  sanitizeSettings,
} from '../helpers/sanitizers'
import { createId } from '@paralleldrive/cuid2'
import { sendTelemetryEvents } from '@typebot.io/lib/telemetry/sendTelemetryEvent'

export const createProbot = authenticatedProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/probots',
      protect: true,
      summary: 'Create a probot',
      tags: ['Probot'],
    },
  })
  .input(
    z.object({
      workspaceId: z.string(),
      probot: probotCreateSchema,
    })
  )
  .output(
    z.object({
      probot: probotSchema,
    })
  )
  .mutation(async ({ input: { probot, workspaceId }, ctx: { user } }) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, members: true, plan: true },
    })
    const userRole = getUserRoleInWorkspace(user.id, workspace?.members)
    if (
      userRole === undefined ||
      userRole === WorkspaceRole.GUEST ||
      !workspace
    )
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' })

    if (
      probot.customDomain &&
      (await isCustomDomainNotAvailable(probot.customDomain))
    )
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Custom domain not available',
      })

    if (probot.publicId && (await isPublicIdNotAvailable(probot.publicId)))
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Public id not available',
      })

    const newProbot = await prisma.probot.create({
      data: {
        version: '5',
        workspaceId,
        name: probot.name ?? 'My probot',
        icon: probot.icon,
        selectedThemeTemplateId: probot.selectedThemeTemplateId,
        groups: probot.groups
          ? await sanitizeGroups(workspaceId)(probot.groups)
          : defaultGroups(),
        theme: probot.theme ? probot.theme : defaultTheme,
        settings: probot.settings
          ? sanitizeSettings(probot.settings, workspace.plan)
          : defaultSettings({
              isBrandingEnabled: workspace.plan === Plan.FREE,
            }),
        folderId: probot.folderId,
        variables: probot.variables ?? [],
        edges: probot.edges ?? [],
        resultsTablePreferences: probot.resultsTablePreferences ?? undefined,
        publicId: probot.publicId ?? undefined,
        customDomain: probot.customDomain ?? undefined,
      },
    })

    const parsedNewProbot = probotSchema.parse(newProbot)

    await sendTelemetryEvents([
      {
        name: 'Probot created',
        workspaceId: parsedNewProbot.workspaceId,
        probotId: parsedNewProbot.id,
        userId: user.id,
        data: {
          name: newProbot.name,
        },
      },
    ])

    return { probot: parsedNewProbot }
  })

const defaultGroups = () => {
  const groupId = createId()
  return [
    {
      id: groupId,
      title: 'Start',
      graphCoordinates: { x: 0, y: 0 },
      blocks: [
        {
          groupId,
          id: createId(),
          label: 'Start',
          type: 'start',
        },
      ],
    },
  ]
}
