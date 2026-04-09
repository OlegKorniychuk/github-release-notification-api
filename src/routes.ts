import { Router } from 'express';
import subscriptionRouter from './modules/subscription/subscription.routes.js';

const router = Router();

router.use('', subscriptionRouter);

export default router;
