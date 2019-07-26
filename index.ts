import Yuque from '@yuque/sdk';
import fs from 'fs-extra';
import PQueue from 'p-queue';
import path from 'path';

export default class Fetcher {
  public options: IFetcher;
  public client: Yuque;
  public queue: PQueue;
  public workspace: string;

  constructor(options: IFetcher) {
    const { yuque, queue, workspace } = options;
    const { concurrency = 30 } = queue;

    this.options = options;
    this.client = new Yuque(yuque);
    this.queue = new PQueue({ concurrency });
    this.workspace = workspace || path.join(process.cwd(), 'data') ;
  }

  public watch() {
    let count = 0;
    const queue = this.queue;

    queue.on('active', () => {
      process.stdout.write(
        `Working on item #${++count}.  Size: ${queue.size}  Pending: ${
        queue.pending
        }`
      );
    });
  }

  public async save(name: string, data: object | string) {
    const raw = name.includes('json') ? JSON.stringify(data, null, 2) : data;
    const workspace = this.workspace;
    const options = {
      encoding: 'utf8',
    };

    fs.outputFileSync(path.join(workspace, name), raw, options);
  }

  public async clean() {
    const workspace = this.workspace;
    fs.emptyDirSync(path.join(workspace));
  }

  public async run(options: IFetcherRun) {
    const { empty = false, watch = false, group, repoPublic = 1 } = options;
    const queue = this.queue;
    const client = this.client;

    // clean workspace
    if (empty) {
      this.clean();
    }

    if (watch) {
      this.watch();
    }

    // fetch repos
    const repos = await client.repos.list({
      group,
    });

    this.save('repos.json', repos);

    // filter books
    const books = repos.filter((repo) => repo.public === repoPublic && repo.type === 'Book');
    this.save('books.json', books);

    // get books
    await Promise.all(
      books.map(async ({ namespace, id, slug: bookSlug }) => {
        const book = await client.repos.get({
          namespace,
        });

        this.save(`${bookSlug}/__book.json`, book);

        // 读取文档列表
        const docs = await client.docs.list({
          namespace,
        });

        this.save(`${bookSlug}/__docs.json`, docs);

        // 读取单片文档
        await Promise.all(
          docs.map(async ({ slug: docSlug }) => {
            queue.add(async () => {
              const doc = await this.client.docs.get({
                data: {
                  raw: 1,
                },
                namespace,
                slug: docSlug,
              });
              this.save(`${bookSlug}/${docSlug}.json`, doc);
              this.save(`${bookSlug}/${docSlug}.md`, doc.body.toString());
            });
          })
        );
      })
    );

    // done
    await queue.onIdle();
  }
}

interface IYuque {
  token?: string;
  endpoint?: string;
  userAgent?: string;
}

interface IQueue {
  concurrency: number;
}

interface IFetcher {
  yuque: IYuque;
  queue: IQueue;
  workspace?: string;
}

interface IFetcherRun {
  group: string;
  empty?: boolean;
  watch?: boolean;
  repoPublic?: number;
}
