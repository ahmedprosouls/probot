/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: 'probot docs',
  tagline: 'Get to probot next level with its documentation',
  url: 'https://docs.probot.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  organizationName: 'baptisteArno', // Usually your GitHub org/user name.
  themeConfig: {
    navbar: {
      title: 'probot',
      logo: {
        alt: 'probot Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: '/',
          label: 'Docs',
          position: 'left',
        },
        {
          href: '/api',
          label: 'API Reference',
          position: 'left',
        },
        {
          href: 'https://github.com/baptisteArno/probot.io/tree/main/apps/docs',
          label: 'Contribute',
          position: 'right',
        },
      ],
    },
    algolia: {
      apiKey: '978429d40094dc0fd2dd02db741b3dbe',
      indexName: 'probot',
      appId: '6GBQ91COKA',
      contextualSearch: false,
    },
    footer: {
      links: [
        {
          title: 'Product',
          items: [
            {
              label: 'Homepage',
              to: 'https://www.probot.io',
            },
            { label: 'Status', to: 'https://status.probot.io' },
            {
              label: 'Roadmap',
              to: 'https://app.probot.io/feedback',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Facebook Group',
              href: 'https://www.facebook.com/groups/probot',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/probot_io',
            },
          ],
        },
        {
          title: 'Company',
          items: [
            {
              label: 'Terms of Service',
              href: 'https://www.probot.io/terms-of-service',
            },
            {
              label: 'Privacy Policy',
              href: 'https://www.probot.io/privacy-policies',
            },
          ],
        },
      ],
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
  },
  presets: [
    [
      '@typebot.io/docusaurus-preset-openapi',
      /** @type {import('@typebot.io/docusaurus-preset-openapi').Options} */
      {
        api: {
          path: 'openapi',
          routeBasePath: '/api',
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          editUrl: ({ docPath }) => {
            return `https://github.com/baptistearno/probot.io/edit/main/apps/docs/docs/${docPath}`
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
}
