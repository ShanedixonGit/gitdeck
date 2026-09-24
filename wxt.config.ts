import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  // WXT resolves publicDir against the project root, not srcDir, so this has to
  // be spelled out or the icons never reach the build and the manifest is invalid.
  publicDir: 'src/public',
  modules: ['@wxt-dev/module-svelte'],
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Repohopper',
    short_name: 'Repohopper',
    description:
      'Opens the GitHub repository you are looking at in other tools, each run by its own provider.',
    homepage_url: 'https://github.com/ShanedixonGit/repohopper',
    permissions: ['activeTab', 'storage'],
    // Firefox only: Chrome and Edge warn about keys they do not know. 140 and
    // 142 are the first releases that read data_collection_permissions, which
    // AMO requires of new add-ons.
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'repohopper@shanedixon.dev',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
    action: {
      default_title: 'Repohopper',
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
  }),
});
