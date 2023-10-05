# Webflow

Head over to the Share tab of your bot and click on the Webflow button to get the embed instructions of your bot.

## Advanced guides

### Trigger a probot command on a click of a button

1. Head over to the `Settings` tab of your button and add a dedicated `ID`
2. In your probot `Embed` element, insert this code in the existing `<script>` tag:

```js
document.getElementById('BUTTON_ID').addEventListener('click', (event) => {
  event.preventDefault()
  probot.open()
})
```

You can add as many as you'd like if you need to open the bot on several button clicks

It should look like:

```html
<script type="module">
  import probot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.1/dist/web.js'

  probot.initPopup({
    probot: 'my-probot',
  })

  document.getElementById('BUTTON_ID_1').addEventListener('click', (event) => {
    event.preventDefault()
    probot.open()
  })

  document.getElementById('BUTTON_ID_2').addEventListener('click', (event) => {
    event.preventDefault()
    probot.open()
  })
</script>
```

Make sure to replace `BUTTON_ID_1` and `BUTTON_ID_2` with the ID you added on your button elements.

In this example we are opening the popup when the specified buttons are clicked but you could also use any of the [available commands](./commands).