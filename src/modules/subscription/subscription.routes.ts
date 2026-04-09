import { Router } from 'express';
import { subscriptionController } from './subscription.controller.js';

const subscriptionRouter = Router();

subscriptionRouter.route('/subscribe').post(subscriptionController.subscribe);

export default subscriptionRouter;
