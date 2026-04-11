import { ScanRunner } from './cron/scan-runner.js';
import { ScannerCron } from './cron/scanner-cron.js';
import { drizzleClient, pool } from './db/client.js';
import { SubscriptionController } from './modules/subscription/subscription.controller.js';
import { subscriptionMapper } from './modules/subscription/subscription.mapper.js';
import { SubscriptionService } from './modules/subscription/subscription.service.js';
import { redisConnection } from './redis/redis.js';
import { GithubRepoRepository } from './repositories/github-repo/github-repo.repository.js';
import { SubscriptionRepository } from './repositories/subscription/subscription.repository.js';
import { CacheService } from './services/cache/cache.service.js';
import { EmailQueueClient } from './services/email-queue/email-queue.service.js';
import { EmailWorker } from './services/email-queue/email-worker.service.js';
import { NotificationTokensService } from './services/notification-tokens-service/notification-tokens.service.js';
import { EmailNotifierStrategy } from './services/notifier/email.strategy.js';
import { NodemailerClient } from './services/notifier/nodemailer-client.js';
import { GithubApiImplementation } from './services/scanner/github-api.js';
import { RepositoryScanner } from './services/scanner/repository-scanner.service.js';

// 1. Environment Variables Validation
const env = {
  githubToken: process.env.GITHUB_TOKEN,
  tokenSecret: process.env.NOTIFICATION_TOKEN_SECRET,
  emailService: process.env.EMAIL_SERVICE,
  emailUser: process.env.EMAIL_SERVICE_USERNAME,
  emailPass: process.env.EMAIL_SERVICE_PASSWORD,
};

if (Object.values(env).some((v) => !v)) {
  throw new Error(
    'Missing required environment variables for dependencies container',
  );
}

// 2. Repositories & APIs
const subscriptionRepository = new SubscriptionRepository(drizzleClient);
const githubRepoRepository = new GithubRepoRepository(drizzleClient);
const githubApi = new GithubApiImplementation(env.githubToken!);
const repoScanner = new RepositoryScanner(githubApi);

// 3. Utilities & Clients
const tokensService = new NotificationTokensService(env.tokenSecret!);
const mailClient = new NodemailerClient(
  env.emailService!,
  env.emailUser!,
  env.emailPass!,
);
const notifier = new EmailNotifierStrategy(mailClient, 'http://localhost:3000');
const emailQueue = new EmailQueueClient(redisConnection);

// 4. Services & Controllers
export const cacheService = new CacheService(redisConnection);

export const subscriptionService = new SubscriptionService(
  subscriptionRepository,
  githubRepoRepository,
  repoScanner,
  tokensService,
  emailQueue,
  cacheService,
);

export const subscriptionController = new SubscriptionController(
  subscriptionService,
  subscriptionMapper,
);

// 5. Background Jobs
const scanRunner = new ScanRunner(
  githubRepoRepository,
  subscriptionRepository,
  repoScanner,
  tokensService,
  emailQueue,
);

export const scannerCron = new ScannerCron(redisConnection, scanRunner);
export const emailWorker = new EmailWorker(redisConnection, notifier);

export const shutdownDependencies = async () => {
  console.log('Closing background workers and queues...');

  await emailWorker.worker.close();
  await scannerCron.worker.close();
  await scannerCron.queue.close();
  await emailQueue.queue.close();

  console.log('Closing database connections...');

  await redisConnection.quit();

  await pool.end();
};
