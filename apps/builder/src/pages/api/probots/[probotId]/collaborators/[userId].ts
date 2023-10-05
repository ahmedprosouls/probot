import prisma from '@typebot.io/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { canEditGuests } from '@/helpers/databaseRules'
import { getAuthenticatedUser } from '@/features/auth/helpers/getAuthenticatedUser'
import { methodNotAllowed, notAuthenticated } from '@typebot.io/lib/api'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getAuthenticatedUser(req, res)
  if (!user) return notAuthenticated(res)
  const probotId = req.query.probotId as string
  const userId = req.query.userId as string
  if (req.method === 'PATCH') {
    const data = req.body
    await prisma.collaboratorsOnProbots.updateMany({
      where: { userId, probot: canEditGuests(user, probotId) },
      data: { type: data.type },
    })
    return res.send({
      message: 'success',
    })
  }
  if (req.method === 'DELETE') {
    await prisma.collaboratorsOnProbots.deleteMany({
      where: { userId, probot: canEditGuests(user, probotId) },
    })
    return res.send({
      message: 'success',
    })
  }
  methodNotAllowed(res)
}

export default handler
