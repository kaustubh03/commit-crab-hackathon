// Manually composed route tree for TanStack Router (non file-based build scenario)
import { Route as rootRoute } from './_layout';
import { Route as indexRoute } from './index';
import { Route as analyticsRoute } from './analytics';
import { Route as prDetailRoute } from './pr/$prId';

export const routeTree = rootRoute.addChildren([
  indexRoute,
  analyticsRoute,
  prDetailRoute,
]);
