import { Router } from 'express';
import { validateRequest } from './utils/middlewares/validateRequest.js';
import {
  subscriptionTokenSchema,
  subscribeSchema,
  listSubscriptionsSchema,
} from './modules/subscription/subscription.schema.js';
import { subscriptionController } from './dependencies-container.js';

const router = Router();

router
  .route('/subscribe')
  .post(
    validateRequest(subscribeSchema),
    subscriptionController.subscribe.bind(subscriptionController),
  );

router
  .route('/confirm/:token')
  .get(
    validateRequest(subscriptionTokenSchema),
    subscriptionController.confirmSubscription.bind(subscriptionController),
  );

router
  .route('/unsubscribe/:token')
  .get(
    validateRequest(subscriptionTokenSchema),
    subscriptionController.unsubscribe.bind(subscriptionController),
  );

router
  .route('/subscriptions')
  .get(
    validateRequest(listSubscriptionsSchema),
    subscriptionController.getSubscriptions.bind(subscriptionController),
  );

export default router;
