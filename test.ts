import { LRUCache } from 'components/PromptProcessor/types';
import { createHash } from 'crypto';

const cache = new LRUCache<string[]>(100);

const prefix = 'aaa \r\n';

const data = ['hello world'];

const cacheKey = createHash('sha1').update(prefix.trimEnd()).digest('base64');

console.log({ cacheKey });
cache.put(cacheKey, data);

const promptCached = cache.get(cacheKey);
if (promptCached) {
  console.log({ promptCached });
} else {
  console.log('no cache');
}
