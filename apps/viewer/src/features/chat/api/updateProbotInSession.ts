import { publicProcedure } from '@/helpers/server/trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { getSession } from '@typebot.io/bot-engine/queries/getSession'
import {
  Publicprobot,
  SessionState,
  probot,
  Variable,
} from '@typebot.io/schemas'
import prisma from '@typebot.io/lib/prisma'

export const updateprobotInSession = publicProcedure
  .meta({
    openapi: {
      method: 'POST',
      path: '/sessions/{sessionId}/updateprobot',
      summary: 'Update probot in session',
      description:
        'Update chat session with latest probot modifications. This is useful when you want to update the probot in an ongoing session after making changes to it.',
      protect: true,
    },
  })
  .input(
    z.object({
      sessionId: z.string(),
    })
  )
  .output(z.object({ message: z.literal('success') }))
  .mutation(async ({ input: { sessionId }, ctx: { user } }) => {
    if (!user)
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
    const session = await getSession(sessionId)
    if (!session)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' })

    const publicprobot = (await prisma.publicprobot.findFirst({
      where: {
        probot: {
          id: session.state.probotsQueue[0].probot.id,
          OR: [
            {
              workspace: {
                members: {
                  some: { userId: user.id, role: { in: ['ADMIN', 'MEMBER'] } },
                },
              },
            },
            {
              collaborators: {
                some: { userId: user.id, type: { in: ['WRITE'] } },
              },
            },
          ],
        },
      },
      select: {
        edges: true,
        groups: true,
        variables: true,
      },
    })) as Pick<Publicprobot, 'edges' | 'variables' | 'groups'> | null

    if (!publicprobot)
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })

    const newSessionState = updateSessionState(session.state, publicprobot)

    await prisma.chatSession.updateMany({
      where: { id: session.id },
      data: { state: newSessionState },
    })

    return { message: 'success' }
  })

const updateSessionState = (
  currentState: SessionState,
  newprobot: Pick<Publicprobot, 'edges' | 'variables' | 'groups'>
): SessionState => ({
  ...currentState,
  probotsQueue: currentState.probotsQueue.map((probotInQueue, index) =>
    index === 0
      ? {
          ...probotInQueue,
          probot: {
            ...probotInQueue.probot,
            edges: newprobot.edges,
            groups: newprobot.groups,
            variables: updateVariablesInSession(
              probotInQueue.probot.variables,
              newprobot.variables
            ),
          },
        }
      : probotInQueue
  ),
})

const updateVariablesInSession = (
  currentVariables: Variable[],
  newVariables: probot['variables']
): Variable[] => [
  ...currentVariables,
  ...newVariables.filter(
    (newVariable) =>
      !currentVariables.find(
        (currentVariable) => currentVariable.id === newVariable.id
      )
  ),
]
