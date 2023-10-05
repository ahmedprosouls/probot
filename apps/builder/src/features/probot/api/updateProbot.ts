import prisma from '@typebot.io/lib/prisma'
import { authenticatedProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { probotCreateSchema, probotSchema } from '@typebot.io/schemas'
import { z } from 'zod'
import {
  isCustomDomainNotAvailable,
  isPublicIdNotAvailable,
  sanitizeGroups,
  sanitizeSettings,
} from '../helpers/sanitizers'
import { isWriteProbotForbidden } from '../helpers/isWriteProbotForbidden'
import { isCloudProdInstance } from '@/helpers/isCloudProdInstance'
import { Prisma } from '@typebot.io/prisma'
import { hasProPerks } from '@/features/billing/helpers/hasProPerks'

export const updateProbot = authenticatedProcedure
  .meta({
    openapi: {
      method: 'PATCH',
      path: '/probots/{probotId}',
      protect: true,
      summary: 'Update a probot',
      tags: ['Probot'],
    },
  })
  .input(
    z.object({
      probotId: z.string(),
      probot: probotCreateSchema.merge(
        probotSchema._def.schema
          .pick({
            isClosed: true,
            whatsAppCredentialsId: true,
          })
          .partial()
      ),
      updatedAt: z
        .date()
        .optional()
        .describe(
          'Used for checking if there is a newer version of the probot in the database'
        ),
    })
  )
  .output(
    z.object({
      probot: probotSchema,
    })
  )
  .mutation(
    async ({ input: { probotId, probot, updatedAt }, ctx: { user } }) => {
      const existingProbot = await prisma.probot.findFirst({
        where: {
          id: probotId,
        },
        select: {
          id: true,
          customDomain: true,
          publicId: true,
          workspaceId: true,
          collaborators: {
            select: {
              userId: true,
              type: true,
            },
          },
          workspace: {
            select: {
              plan: true,
            },
          },
          updatedAt: true,
        },
      })

      if (
        !existingProbot?.id ||
        (await isWriteProbotForbidden(existingProbot, user))
      )
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Probot not found',
        })

      if (
        updatedAt &&
        updatedAt.getTime() > new Date(existingProbot?.updatedAt).getTime()
      )
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Found newer version of the probot in database',
        })

      if (
        probot.customDomain &&
        existingProbot.customDomain !== probot.customDomain &&
        (await isCustomDomainNotAvailable(probot.customDomain))
      )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Custom domain not available',
        })

      if (probot.publicId) {
        if (isCloudProdInstance() && probot.publicId.length < 4)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Public id should be at least 4 characters long',
          })
        if (
          existingProbot.publicId !== probot.publicId &&
          (await isPublicIdNotAvailable(probot.publicId))
        )
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Public id not available',
          })
      }

      if (
        probot.settings?.whatsApp?.isEnabled &&
        !hasProPerks(existingProbot.workspace)
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'WhatsApp can be enabled only on a Pro workspaces',
        })
      }

      const newProbot = await prisma.probot.update({
        where: {
          id: existingProbot.id,
        },
        data: {
          version: '5',
          name: probot.name,
          icon: probot.icon,
          selectedThemeTemplateId: probot.selectedThemeTemplateId,
          groups: probot.groups
            ? await sanitizeGroups(existingProbot.workspaceId)(probot.groups)
            : undefined,
          theme: probot.theme ? probot.theme : undefined,
          settings: probot.settings
            ? sanitizeSettings(probot.settings, existingProbot.workspace.plan)
            : undefined,
          folderId: probot.folderId,
          variables: probot.variables,
          edges: probot.edges,
          resultsTablePreferences:
            probot.resultsTablePreferences === null
              ? Prisma.DbNull
              : probot.resultsTablePreferences,
          publicId:
            probot.publicId === null
              ? null
              : probot.publicId && isPublicIdValid(probot.publicId)
              ? probot.publicId
              : undefined,
          customDomain:
            probot.customDomain === null ? null : probot.customDomain,
          isClosed: probot.isClosed,
          whatsAppCredentialsId: probot.whatsAppCredentialsId ?? undefined,
        },
      })

      return { probot: probotSchema.parse(newProbot) }
    }
  )

const isPublicIdValid = (str: string) =>
  /^([a-z0-9]+-[a-z0-9]*)*$/.test(str) || /^[a-z0-9]*$/.test(str)
