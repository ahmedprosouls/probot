# Commands

Here are the commands you can use to trigger your embedded probot:

- `probot.open()`: Open popup or bubble
- `probot.close()`: Close popup or bubble
- `probot.toggle()`: Toggle the bubble or popup open/close state,
- `probot.showPreviewMessage()`: Show preview message from the bubble,
- `probot.hidePreviewMessage()`: Hide preview message from the bubble,
- `probot.setPrefilledVariables(...)`: Set prefilled variables.
- `probot.setInputValue(...)`: Set the value in the currently displayed input.

  Example:

  ```js
  probot.setPrefilledVariables({
    Name: 'Jhon',
    Email: 'john@gmail.com',
  })
  ```

  For more information, check out the [HTML & Javascript additional configurations](./html-javascript#additional-configuration)
