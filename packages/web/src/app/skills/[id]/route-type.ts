import { z } from 'zod';

export const Route = {
  routeParams: z.object({
    id: z.uuid(),
  }),
};

export type RouteType = typeof Route;
