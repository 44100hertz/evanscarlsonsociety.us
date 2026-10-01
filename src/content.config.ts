import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One JSON per article, written by `pnpm sync`. The file name is the slug, so
// entry.id is the slug. Dimensions come from the image build (see tools/sync.mjs)
// and are emitted as width/height attributes to avoid layout shift.
const articles = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().default(''),
    date: z.string(),
    author: z.string(),
    canonical: z.string(),
    pub: z.string(),
    body: z.string(),
    thumbW: z.number(),
    thumbH: z.number(),
    fullW: z.number(),
    fullH: z.number(),
  }),
});

export const collections = { articles };
