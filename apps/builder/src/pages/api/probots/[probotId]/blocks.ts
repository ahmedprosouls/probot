import prisma from '@typebot.io/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { canReadProbots } from '@/helpers/databaseRules'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import {
  methodNotAllowed,
  notAuthenticated,
  notFound,
} from '@typebot.io/lib/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req, res)
  if (!user) return notAuthenticated(res)
  if (req.method === 'GET') {
    const probotId = req.query.probotId as string
    const probot = await prisma.probot.findFirst({
      where: canReadProbots(probotId, user),
      select: { groups: true },
    })
    if (!probot) return notFound(res)
    return res.send({ groups: probot.groups })
  }
  methodNotAllowed(res)
}

export default handler
