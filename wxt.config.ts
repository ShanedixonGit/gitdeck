import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  // WXT resolves publicDir against the project root, not srcDir, so this has to
  // be spelled out or the icons never reach the build and the manifest is invalid.
  publicDir: 'src/public',
  modules: ['@wxt-dev/module-svelte'],
  manifestVersion: 3,
  manifest: {
    name: 'GitDeck',
    short_name: 'GitDeck',
    description:
      'Opens the GitHub repository you are looking at in other tools, each run by its own provider.',
    permissions: ['activeTab', 'storage'],
    browser_specific_settings: {
      gecko: {
        id: 'gitdeck@shanedixon.dev',
        strict_min_version: '115.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
    action: {
      default_title: 'GitDeck',
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
  },
});
