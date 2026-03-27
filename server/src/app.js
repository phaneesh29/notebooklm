import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import httpStatus from 'http-status';
import env from './config/env.js';
import routes from './routes/index.js';
import { errorConverter, errorHandler } from './middlewares/error.middleware.js';
import ApiError from './utils/ApiError.js';
import { clerkMiddleware } from '@clerk/express';
import { globalLimiter } from './middlewares/rateLimiter.js';
import webhookRoutes from './routes/webhook.route.js';

const app = express();

app.use(morgan('dev'));
app.use(helmet());

app.use('/api/v1/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors({
  origin: env.corsOrigin,
  credentials: true
}));

app.use(clerkMiddleware());

app.use('/api/v1', globalLimiter, routes);

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

app.use(errorConverter);
app.use(errorHandler);

export default app;
