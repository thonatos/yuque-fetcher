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
    endpoint: process.env.YUQUE_ENDPOINT,
    token: process.env.YUQUE_TOKEN,
  },
};

describe('index.ts', () => {

  const workspace = path.join(
    path.resolve(__dirname) || process.cwd(),
    'docs'
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

  test('should filter books', async () => {
    const books = fs.readJSONSync(path.join(workspace, 'books.json'));
    expect(books.length).toBeGreaterThan(0);
  });

  test('should load book', async () => {
    const books = fs.readJSONSync(path.join(workspace, 'books.json'));
    const { slug } = books[0];
    const docs = fs.readJSONSync(path.join(workspace, `${slug}/.docs.json`));
    expect(docs.length).toBeGreaterThan(0);
  });
});
