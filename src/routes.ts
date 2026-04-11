import { Router } from 'express';
import { SubscriptionController } from './modules/subscription/subscription.controller.js';
import { SubscriptionService } from './modules/subscription/subscription.service.js';
import { SubscriptionRepository } from './repositories/subscription/subscription.repository.js';
import { drizzleClient } from './db/client.js';
import { GithubRepoRepository } from './repositories/github-repo/github-repo.repository.js';
import { RepositoryScanner } from './services/scanner/repository-scanner.service.js';
import { GithubApiImplementation } from './services/scanner/github-api.js';
import { NotificationTokensService } from './services/notification-tokens-service/notification-tokens.service.js';
import { EmailNotifierStrategy } from './services/notifier/email.strategy.js';
import { NodemailerClient } from './services/notifier/nodemailer-client.js';
import { validateRequest } from './utils/middlewares/validateRequest.js';
import {
  subscriptionTokenSchema,
  subscribeSchema,
  listSubscriptionsSchema,
} from './modules/subscription/subscription.schema.js';
import { subscriptionMapper } from './modules/subscription/subscription.mapper.js';
import { redisConnection } from './redis/redis.js';
import { EmailQueueClient } from './services/email-queue/email-queue.service.js';
import { EmailWorker } from './services/email-queue/email-worker.service.js';
import { ScanRunner } from './cron/scan-runner.js';
import { ScannerCron } from './cron/scanner-cron.js';

const githubApiToken = process.env.GITHUB_TOKEN;
if (!githubApiToken) throw new Error('Github api token missing');

const notificationTokenSecret = process.env.NOTIFICATION_TOKEN_SECRET;
if (!notificationTokenSecret)
  throw new Error('Notification token secret missing!');

const emailService = process.env.EMAIL_SERVICE;
if (!emailService) throw new Error('Email service name missing!');

const emailServiceUsername = process.env.EMAIL_SERVICE_USERNAME;
if (!emailServiceUsername) throw new Error('Email service username missing!');

const emailServicePassword = process.env.EMAIL_SERVICE_PASSWORD;
if (!emailServicePassword) throw new Error('Email service password missing!');

const subscriptionRepository = new SubscriptionRepository(drizzleClient);
const githubRepoRepository = new GithubRepoRepository(drizzleClient);

const githubApi = new GithubApiImplementation(githubApiToken);
const repoScanner = new RepositoryScanner(githubApi);

const tokensService = new NotificationTokensService(notificationTokenSecret);

const mailClient = new NodemailerClient(
  emailService,
  emailServiceUsername,
  emailServicePassword,
);
const notifier = new EmailNotifierStrategy(mailClient, 'http://localhost:3000');

const emailQueue = new EmailQueueClient(redisConnection);

new EmailWorker(redisConnection, notifier);

const subscriptionService = new SubscriptionService(
  subscriptionRepository,
  githubRepoRepository,
  repoScanner,
  tokensService,
  emailQueue,
);
const subscriptionController = new SubscriptionController(
  subscriptionService,
  subscriptionMapper,
);

const scanRunner = new ScanRunner(
  githubRepoRepository,
  subscriptionRepository,
  repoScanner,
  tokensService,
  emailQueue,
);
const scannerCron = new ScannerCron(redisConnection, scanRunner);

await scannerCron.startSchedule();

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
