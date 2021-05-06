import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import Loader from '../index';

dotenv.config();

const options = {
  queue: {
    concurrency: 20,
  },
  yuque: {
    token: process.env.YUQUE_TOKEN,
    endpoint: process.env.YUQUE_ENDPOINT,
  },
};

describe('index.ts', () => {

  const workspace = path.join(
    path.resolve(__dirname) || process.cwd(),
    'docs',
  );

  const loader = new Loader({
    ...options,
    workspace,
  });

  beforeAll(async () => {
    await loader.run({
      empty: true,
      watch: true,
      group: process.env.YUQUE_GROUP || 'default',
      filter: {
        type: 'Column',
      },
    });
  }, 30 * 1000);

  afterAll(() => {
    fs.emptyDirSync(workspace);
  });

  test('should init client', () => {
    expect(loader.client.options.token).toBe(options.yuque.token);
  });

  test('should load repos', async () => {
    const repos = fs.readJSONSync(path.join(workspace, 'repos.json'));
    expect(repos.length).toBeGreaterThan(0);
  });
});
