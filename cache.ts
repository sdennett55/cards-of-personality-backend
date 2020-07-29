interface Options {
  key: string;
  ttl: number;
  data: string;
  timer?: object;
};
interface CacheInstance {
  [name: string]: Options
}

export class DeckCache {
  caches: CacheInstance = {};

  constructor(options: Options) {
    if (options) {
      this.set(options);
    }
  }

  set(cache: Options): void {
    this.setTTL(cache);
    this.caches[cache.key] = cache;
  }

  get(key: string): string {
    return this.caches[key]?.data;
  }

  clear(cache: Options) {
    delete this.caches[cache.key];
  }

  setTTL(cache: Options): void {
    const timer = setTimeout(() => {
      this.clear(cache);
    }, cache.ttl * 1000);
    this.caches[cache.key] = {...this.caches[cache.key], timer}
  }
}
