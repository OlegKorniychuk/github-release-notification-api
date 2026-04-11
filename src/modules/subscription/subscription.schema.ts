import { z } from 'zod';

const githubRepoRegex = /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+$/;

export const subscribeSchema = z.object({
  body: z.object({
    email: z.email('Please provide a valid email address'),
    repo: z
      .string()
      .regex(
        githubRepoRegex,
        "Invalid format. Must be 'owner/repository' (e.g., 'golang/go')",
      ),
  }),
});

export const confirmSubscriptionSchema = z.object({
  params: z.object({
    token: z.jwt('Confirmation token must be a JWT'),
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>['body'];
export type ConfirmInput = z.infer<typeof confirmSubscriptionSchema>['params'];
