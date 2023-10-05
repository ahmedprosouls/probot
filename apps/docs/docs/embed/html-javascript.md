---
sidebar_position: 4
---

# HTML & Javascript

## Standard

You can get the standard HTML and Javascript code by clicking on the "HTML & Javascript" button in the "Share" tab of your probot.

There, you can change the container dimensions. Here is a code example:

```html
<script type="module">
  import probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  probot.initStandard({
    probot: 'my-probot',
  })
</script>

<probot-standard style="width: 100%; height: 600px; "></probot-standard>
```

This code is creating a container with a 100% width (will match parent width) and 600px height.

## Popup

You can get the popup HTML and Javascript code by clicking on the "HTML & Javascript" button in the "Share" tab of your probot.

Here is an example:

```html
<script type="module">
  import probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  probot.initPopup({
    probot: 'my-probot',
    apiHost: 'http://localhost:3001',
    autoShowDelay: 3000,
  })
</script>
```

This code will automatically trigger the popup window after 3 seconds.

### Open or Close a popup

You can use these commands:

```js
probot.open()
```

```js
probot.close()
```

```js
probot.toggle()
```

You can bind these commands on a button element, for example:

```html
<button onclick="probot.open()">Contact us</button>
```

### Multiple bots

If you have different bots on the same page you will have to make them distinct with an additional `id` prop:

```html
<script type="module">
  import probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  probot.initStandard({
    id: 'bot1'
    probot: 'my-probot',
  })

  probot.initStandard({
    id: 'bot2'
    probot: 'my-probot-2',
  })
</script>

<probot-standard
  id="bot1"
  style="width: 100%; height: 600px; "
></probot-standard>
...
<probot-standard
  id="bot2"
  style="width: 100%; height: 600px; "
></probot-standard>
```

## Bubble

You can get the bubble HTML and Javascript code by clicking on the "HTML & Javascript" button in the "Share" tab of your probot.

Here is an example:

```html
<script type="module">
  import probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  probot.initBubble({
    probot: 'my-probot',
    previewMessage: {
      message: 'I have a question for you!',
      autoShowDelay: 5000,
      avatarUrl: 'https://avatars.githubusercontent.com/u/16015833?v=4',
    },
    theme: {
      button: { backgroundColor: '#0042DA', iconColor: '#FFFFFF' },
      previewMessage: { backgroundColor: '#ffffff', textColor: 'black' },
      chatWindow: { backgroundColor: '#ffffff' },
    },
  })
</script>
```

This code will show the bubble and let a preview message appear after 5 seconds.

### Open or close the preview message

You can use these commands:

```js
probot.showPreviewMessage()
```

```js
probot.hidePreviewMessage()
```

### Open or close the probot

You can use these commands:

```js
probot.open()
```

```js
probot.close()
```

```js
probot.toggle()
```

You can bind these commands on a button element, for example:

```html
<button onclick="probot.open()">Contact us</button>
```

### Custom button position

You can move the button with some custom CSS on your website. For example, you can place the bubble button higher with the following CSS:

```css
probot-bubble::part(button) {
  bottom: 60px;
}

probot-bubble::part(bot) {
  bottom: 140px;
  height: calc(100% - 140px)
}
```

If you have a preview message, you'll also have to manually position it:

```css
probot-bubble::part(preview-message) {
  bottom: 140px;
}
```

## Callbacks

If you need to trigger events on your parent website when the user interact with the bot, you can use the following callbacks:

```js
probot.initStandard({
  probot: 'my-probot',
  onNewInputBlock: (inputBlock) => {
    console.log('New input block displayed', inputBlock.id)
  },
  onAnswer: (answer) => {
    console.log('Answer received', answer.message, answer.blockId)
  },
  onInit: () => {
    console.log('Bot initialized')
  },
  onEnd: () => {
    console.log('Bot ended')
  },
})
```

## Additional configuration

You can prefill the bot variable values in your embed code by adding the `prefilledVariables` option. Here is an example:

```js
probot.initStandard({
  probot: 'my-probot',
  prefilledVariables: {
    'Current URL': 'https://my-site/account',
    'User name': 'John Doe',
  },
})
```

It will prefill the `Current URL` variable with "https://my-site/account" and the `User name` variable with "John Doe". More info about variables: [here](/editor/variables).

Note that if your site URL contains query params (i.e. https://probot.io?User%20name=John%20Doe), the variables will automatically be injected to the probot. So you don't need to manually transfer query params to the bot embed configuration.
