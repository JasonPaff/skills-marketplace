import { z } from 'zod';

export const Route = {
  searchParams: z.object({
    search: z.string().optional(),
    rating: z.coerce.number().int().optional(),
    downloads: z.coerce.number().int().optional(),
  }),
};

export type RouteType = typeof Route;
