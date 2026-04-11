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

const subscriptionService = new SubscriptionService(
  subscriptionRepository,
  githubRepoRepository,
  repoScanner,
  tokensService,
  notifier,
);
const subscriptionController = new SubscriptionController(subscriptionService);

const router = Router();

router
  .route('/subscribe')
  .post(subscriptionController.subscribe.bind(subscriptionController));

router
  .route('/confirm/:token')
  .get(subscriptionController.confirmSubscription.bind(subscriptionController));

export default router;
