---
sidebar_position: 5
---

# Link to probot

The probot link logic block allows you to go into another probot flow. This ultimately helps keep your flows clean and be able to reuse a flow in multiple places.

<img
  src="/img/blocks/logic/link.png"
  width="100%"
  style={{ maxWidth: '600px' }}
  alt="Link to probot logic block"
/>

Variables are shared by default, you just need them to make sure they are present in the variables dropdown on both flows.

## Link to the current probot

You can also use this block to "clean" your flow of any long edges (connected arrows). For example, if you want the user to start the current bot again. Instead of connecting a gigantic arrow to the first group, you could add a "Link to probot" block, choose "Current bot" and select the first group of your flow.
