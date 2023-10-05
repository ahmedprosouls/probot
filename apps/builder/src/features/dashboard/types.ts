import { Probot } from '@typebot.io/schemas'

export type ProbotInDashboard = Pick<Probot, 'id' | 'name' | 'icon'> & {
  publishedProbotId?: string
}
