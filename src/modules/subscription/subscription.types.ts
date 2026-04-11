export type SubscriptionResponse = {
  email: string;
  repo: string;
  confirmed: boolean;
  lastSeenTag: string | null;
};
