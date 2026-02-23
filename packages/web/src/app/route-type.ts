import { z } from 'zod';

export const Route = {
  searchParams: z.object({
    search: z.string().optional(),
  }),
};

export type RouteType = typeof Route;
