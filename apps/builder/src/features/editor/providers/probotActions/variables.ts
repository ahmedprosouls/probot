import { Probot, Variable } from '@typebot.io/schemas'
import { SetProbot } from '../ProbotProvider'
import { Draft, produce } from 'immer'

export type VariablesActions = {
  createVariable: (variable: Variable) => void
  updateVariable: (
    variableId: string,
    updates: Partial<Omit<Variable, 'id'>>
  ) => void
  deleteVariable: (variableId: string) => void
}

export const variablesAction = (setProbot: SetProbot): VariablesActions => ({
  createVariable: (newVariable: Variable) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        probot.variables.push(newVariable)
      })
    ),
  updateVariable: (
    variableId: string,
    updates: Partial<Omit<Variable, 'id'>>
  ) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        probot.variables = probot.variables.map((v) =>
          v.id === variableId ? { ...v, ...updates } : v
        )
      })
    ),
  deleteVariable: (itemId: string) =>
    setProbot((probot) =>
      produce(probot, (probot) => {
        deleteVariableDraft(probot, itemId)
      })
    ),
})

export const deleteVariableDraft = (
  probot: Draft<Probot>,
  variableId: string
) => {
  const index = probot.variables.findIndex((v) => v.id === variableId)
  probot.variables.splice(index, 1)
}
