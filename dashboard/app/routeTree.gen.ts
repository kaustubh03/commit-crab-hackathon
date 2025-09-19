// Route tree assembly using explicit createRoute definitions
import { rootRoute } from './_layout';
import { indexRoute } from './index';
import { analyticsRoute } from './analytics';
import { prDetailRoute } from './pr/$prId';

export const routeTree = rootRoute.addChildren([
  indexRoute,
  analyticsRoute,
  prDetailRoute,
]);
