import {
  Background,
  ChatTheme,
  ContainerColors,
  GeneralTheme,
  InputColors,
  Theme,
} from '@typebot.io/schemas'
import { BackgroundType } from '@typebot.io/schemas/features/probot/theme/enums'
import { isLight, hexToRgb } from '@typebot.io/lib/hexToRgb'
import { isNotEmpty } from '@typebot.io/lib'

const cssVariableNames = {
  general: {
    bgImage: '--probot-container-bg-image',
    bgColor: '--probot-container-bg-color',
    fontFamily: '--probot-container-font-family',
    color: '--probot-container-color',
  },
  chat: {
    hostBubbles: {
      bgColor: '--probot-host-bubble-bg-color',
      color: '--probot-host-bubble-color',
    },
    guestBubbles: {
      bgColor: '--probot-guest-bubble-bg-color',
      color: '--probot-guest-bubble-color',
    },
    inputs: {
      bgColor: '--probot-input-bg-color',
      color: '--probot-input-color',
      placeholderColor: '--probot-input-placeholder-color',
    },
    buttons: {
      bgColor: '--probot-button-bg-color',
      bgColorRgb: '--probot-button-bg-color-rgb',
      color: '--probot-button-color',
    },
    checkbox: {
      bgColor: '--probot-checkbox-bg-color',
      color: '--probot-checkbox-color',
      baseAlpha: '--selectable-base-alpha',
    },
  },
} as const

export const setCssVariablesValue = (
  theme: Theme | undefined,
  container: HTMLDivElement
) => {
  if (!theme) return
  const documentStyle = container?.style
  if (!documentStyle) return
  if (theme.general) setGeneralTheme(theme.general, documentStyle)
  if (theme.chat) setChatTheme(theme.chat, documentStyle)
}

const setGeneralTheme = (
  generalTheme: GeneralTheme,
  documentStyle: CSSStyleDeclaration
) => {
  const { background, font } = generalTheme
  if (background) setProbotBackground(background, documentStyle)
  if (font) documentStyle.setProperty(cssVariableNames.general.fontFamily, font)
}

const setChatTheme = (
  chatTheme: ChatTheme,
  documentStyle: CSSStyleDeclaration
) => {
  const { hostBubbles, guestBubbles, buttons, inputs, roundness } = chatTheme
  if (hostBubbles) setHostBubbles(hostBubbles, documentStyle)
  if (guestBubbles) setGuestBubbles(guestBubbles, documentStyle)
  if (buttons) setButtons(buttons, documentStyle)
  if (inputs) setInputs(inputs, documentStyle)
  if (roundness) setRoundness(roundness, documentStyle)
}

const setHostBubbles = (
  hostBubbles: ContainerColors,
  documentStyle: CSSStyleDeclaration
) => {
  if (hostBubbles.backgroundColor)
    documentStyle.setProperty(
      cssVariableNames.chat.hostBubbles.bgColor,
      hostBubbles.backgroundColor
    )
  if (hostBubbles.color)
    documentStyle.setProperty(
      cssVariableNames.chat.hostBubbles.color,
      hostBubbles.color
    )
}

const setGuestBubbles = (
  guestBubbles: ContainerColors,
  documentStyle: CSSStyleDeclaration
) => {
  if (guestBubbles.backgroundColor)
    documentStyle.setProperty(
      cssVariableNames.chat.guestBubbles.bgColor,
      guestBubbles.backgroundColor
    )
  if (guestBubbles.color)
    documentStyle.setProperty(
      cssVariableNames.chat.guestBubbles.color,
      guestBubbles.color
    )
}

const setButtons = (
  buttons: ContainerColors,
  documentStyle: CSSStyleDeclaration
) => {
  if (buttons.backgroundColor) {
    documentStyle.setProperty(
      cssVariableNames.chat.buttons.bgColor,
      buttons.backgroundColor
    )
    documentStyle.setProperty(
      cssVariableNames.chat.buttons.bgColorRgb,
      hexToRgb(buttons.backgroundColor).join(', ')
    )
  }

  if (buttons.color)
    documentStyle.setProperty(
      cssVariableNames.chat.buttons.color,
      buttons.color
    )
}

const setInputs = (inputs: InputColors, documentStyle: CSSStyleDeclaration) => {
  if (inputs.backgroundColor)
    documentStyle.setProperty(
      cssVariableNames.chat.inputs.bgColor,
      inputs.backgroundColor
    )
  if (inputs.color)
    documentStyle.setProperty(cssVariableNames.chat.inputs.color, inputs.color)
  if (inputs.placeholderColor)
    documentStyle.setProperty(
      cssVariableNames.chat.inputs.placeholderColor,
      inputs.placeholderColor
    )
}

const setProbotBackground = (
  background: Background,
  documentStyle: CSSStyleDeclaration
) => {
  documentStyle.setProperty(cssVariableNames.general.bgImage, null)
  documentStyle.setProperty(cssVariableNames.general.bgColor, null)
  documentStyle.setProperty(
    background?.type === BackgroundType.IMAGE
      ? cssVariableNames.general.bgImage
      : cssVariableNames.general.bgColor,
    parseBackgroundValue(background)
  )
  documentStyle.setProperty(
    cssVariableNames.chat.checkbox.bgColor,
    background?.type === BackgroundType.IMAGE
      ? 'rgba(255, 255, 255, 0.75)'
      : (background?.type === BackgroundType.COLOR
          ? background.content
          : '#ffffff') ?? '#ffffff'
  )
  const backgroundColor =
    background.type === BackgroundType.IMAGE
      ? '#000000'
      : background?.type === BackgroundType.COLOR &&
        isNotEmpty(background.content)
      ? background.content
      : '#ffffff'
  documentStyle.setProperty(
    cssVariableNames.general.color,
    isLight(backgroundColor) ? '#303235' : '#ffffff'
  )
  if (background.type === BackgroundType.IMAGE) {
    documentStyle.setProperty(cssVariableNames.chat.checkbox.baseAlpha, '0.40')
  } else {
    documentStyle.setProperty(cssVariableNames.chat.checkbox.baseAlpha, '0')
  }
}

const parseBackgroundValue = ({ type, content }: Background) => {
  switch (type) {
    case BackgroundType.NONE:
      return 'transparent'
    case BackgroundType.COLOR:
      return content ?? '#ffffff'
    case BackgroundType.IMAGE:
      return `url(${content})`
  }
}

const setRoundness = (
  roundness: NonNullable<ChatTheme['roundness']>,
  documentStyle: CSSStyleDeclaration
) => {
  switch (roundness) {
    case 'none':
      documentStyle.setProperty('--probot-border-radius', '0')
      break
    case 'medium':
      documentStyle.setProperty('--probot-border-radius', '6px')
      break
    case 'large':
      documentStyle.setProperty('--probot-border-radius', '20px')
      break
  }
}
