# Yuque Loader &middot; [![GitHub license][license-square]][license-url]

[![Egg.js][egg-square]][egg-url]
[![Semantic Release][semantic-release-square]][semantic-release-url]
[![NPM Version][npm-square]][npm-url]
[![Codecov][codecov-square]][codecov-url]
[![Travis][travis-square]][travis-url]

[license-square]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: https://github.com/thonatos/yuque-loader/blob/HEAD/LICENSE
[egg-square]: https://img.shields.io/badge/Awesome-Egg.js-ff69b4.svg?style=flat-square
[egg-url]: https://eggjs.org/
[npm-square]: https://img.shields.io/npm/v/yuque-loader.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/yuque-loader
[codecov-square]: https://img.shields.io/codecov/c/github/thonatos/yuque-loader.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/thonatos/yuque-loader
[travis-square]: https://img.shields.io/travis/thonatos/yuque-loader.svg?style=flat-square
[travis-url]: https://travis-ci.org/thonatos/yuque-loader
[semantic-release-square]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release

> Load Yuque Group Docs to local directory.

## Install

```sh
npm install yuque-loader
```

## Usage

```ts
import Loader from 'yuque-loader';

const options = {
  queue: {
    concurrency: 20,
  },
  yuque: {
    endpoint: process.env.YUQUE_ENDPOINT,
    token: process.env.YUQUE_TOKEN,
  },
};

(async () => {
  const workspace = path.join(
    path.resolve(__dirname) || process.cwd(),
    'data'
  );

  const loader = new Loader({
    ...options,
    workspace,
  });

  await loader.run({
    empty: true,
    group: process.env.YUQUE_GROUP || 'default',
  });
})();
```
