import prisma from '@typebot.io/lib/prisma'
import { Stats } from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import { canReadProbots } from '@/helpers/databaseRules'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import { methodNotAllowed, notAuthenticated } from '@typebot.io/lib/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req, res)
  if (!user) return notAuthenticated(res)
  if (req.method === 'GET') {
    const probotId = req.query.probotId as string

    const probot = await prisma.probot.findFirst({
      where: canReadProbots(probotId, user),
      select: { id: true },
    })

    if (!probot) return res.status(404).send({ message: 'Probot not found' })

    const [totalViews, totalStarts, totalCompleted] = await prisma.$transaction(
      [
        prisma.result.count({
          where: {
            probotId: probot.id,
            isArchived: false,
          },
        }),
        prisma.result.count({
          where: {
            probotId: probot.id,
            isArchived: false,
            hasStarted: true,
          },
        }),
        prisma.result.count({
          where: {
            probotId: probot.id,
            isArchived: false,
            isCompleted: true,
          },
        }),
      ]
    )

    const stats: Stats = {
      totalViews,
      totalStarts,
      totalCompleted,
    }
    return res.status(200).send({ stats })
  }
  return methodNotAllowed(res)
}

export default handler
