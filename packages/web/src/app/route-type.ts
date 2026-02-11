import { z } from 'zod';

export const Route = {
  searchParams: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
  }),
};

export type RouteType = typeof Route;
