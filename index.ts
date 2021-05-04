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
    const { yuque, queue, workspace, target = 'docs' } = options;
    const { concurrency = 30 } = queue;

    this.options = options;
    this.client = new Yuque(yuque);
    this.queue = new PQueue({ concurrency });
    this.workspace = workspace || path.join(process.cwd(), target);
  }

  public async getRepos(group: string, filter) {
    const client = this.client;

    const { public: repoPublic = 1, slug = '', type = 'Book' } = filter || {};

    const repos = await client.repos.list({
      group,
    });

    const books = repos.filter((repo) => {
      let f = true;

      if (repoPublic) {
        f = repo.public === repoPublic;
      }

      if (slug) {
        f = f && repo.type === type;
      }

      if (type) {
        f = f && repo.slug === slug;
      }

      return f;
    });

    return {
      books,
      repos,
    };
  }

  public async getRepo(namespace: string) {
    const client = this.client;

    const book = await client.repos.get({
      namespace,
    });

    const docs = await client.docs.list({
      namespace,
    });

    return {
      book,
      docs,
    };
  }

  public async getDoc(namespace: string, docSlug: string) {
    return await this.client.docs.get({
      data: {
        raw: 1,
      },
      namespace,
      slug: docSlug,
    });
  }

  public async run(options: IFetcherRun) {
    const { empty = false, watch = false, group, user , filter } = options;
    const queue = this.queue;

    // clean
    if (empty) {
      this.clean();
    }

    // watch
    if (watch) {
      this.watch();
    }

    // fetch
    const { repos, books } = await this.getRepos(user || group, filter);
    this.save('repos.json', repos);
    this.save('books.json', books);

    await Promise.all(books.map(async ({ namespace, slug: bookSlug }) => {
      const { book, docs } = await this.getRepo(namespace);
      this.save(`${bookSlug}/.book.json`, book);
      this.save(`${bookSlug}/.docs.json`, docs);

      await Promise.all(
        docs.map(async ({ slug: docSlug }) => {
          queue.add(async () => {
            const doc = await this.getDoc(namespace, docSlug);
            this.save(`${bookSlug}/${docSlug}.json`, doc);
            this.save(`${bookSlug}/${docSlug}.md`, doc.body.toString());
          });
        })
      );
    }));

    // done
    await queue.onIdle();
  }

  private async clean() {
    const workspace = this.workspace;
    fs.emptyDirSync(path.join(workspace));
  }

  private async save(name: string, data: object | string) {
    const raw = name.includes('json') ? JSON.stringify(data, null, 2) : data;
    const workspace = this.workspace;
    const options = {
      encoding: 'utf8',
    };

    fs.outputFileSync(path.join(workspace, name), raw, options);
  }

  private watch() {
    let count = 0;
    const queue = this.queue;

    queue.on('active', () => {
      process.stdout.write(
        `Working on item #${++count}.  Size: ${queue.size}  Pending: ${queue.pending}`
      );
    });
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
  target?: string;
}

interface IFetcherRun {
  group: string;
  user?: string;
  empty?: boolean;
  watch?: boolean;
  filter?: {
    type?: string;
    slug?: string;
    public?: number;
  };
}
