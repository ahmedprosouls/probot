---
sidebar_position: 1
slug: /
---

# Introduction

probot currently offers 2 APIs: **Builder** and **Chat**

## Builder

The Builder API is about what you can edit on https://app.probot.io (i.e. create probots, insert blocks etc, get results...). It is currently under active development and new endpoints will be added incrementally.

## Chat

:::caution
You should not use it in production. This API is experimental at the moment and will be changed without notice.
:::

The Chat API allows you to execute (chat) with a probot.

### How to find my `probotId`

If you'd like to execute the probot in preview mode, you will need to provide the ID of the building probot available in the editor URL:

<img
  src="/img/api/probotId.png"
  width="900"
  alt="Get probot ID"
/>

For published probot execution, you need to provide the public probot ID available here:

<img
  src="/img/api/publicId.png"
  width="900"
  alt="Get probot ID"
/>
