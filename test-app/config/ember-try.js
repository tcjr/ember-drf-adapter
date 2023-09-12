'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  return {
    usePnpm: true,
    scenarios: [
      {
        name: 'ember-lts-4.8',
        npm: {
          devDependencies: {
            'ember-data': '~4.8.0',
            'ember-source': '~4.8.0',
          },
        },
      },
      {
        name: 'ember-lts-4.12',
        npm: {
          devDependencies: {
            'ember-data': '~4.12.0',
            'ember-source': '~4.12.0',
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-data': 'latest',
            'ember-source': await getChannelURL('release'),
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-data': 'beta',
            'ember-source': await getChannelURL('beta'),
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-data': 'canary',
            'ember-source': await getChannelURL('canary'),
          },
        },
      },
      embroiderSafe(),
      embroiderOptimized({
        npm: {
          devDependencies: {
            '@embroider/core': '~3.0.0',
            '@embroider/webpack': '~3.0.0',
            '@embroider/compat': '~3.0.0',
          },
        },
      }),
    ],
  };
};
