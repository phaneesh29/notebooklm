import express from 'express';
import healthRoute from './health.route.js';
import authRoute from './auth.route.js';
import groupRoute from './group.route.js';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/health',
    route: healthRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/groups',
    route: groupRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
