import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  env: process.env.NODE_ENV ?? 'development',

  services: {
    auth: process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001',
    listing: process.env.LISTING_SERVICE_URL ?? 'http://localhost:4002',
    search: process.env.SEARCH_SERVICE_URL ?? 'http://localhost:4003',
    image: process.env.IMAGE_SERVICE_URL ?? 'http://localhost:4004',
    notification:
      process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:4005',
    payment: process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:4006',
    profile: process.env.PROFILE_SERVICE_URL ?? 'http://localhost:4007',
    feed: process.env.FEED_SERVICE_URL ?? 'http://localhost:4008',
    review: process.env.REVIEW_SERVICE_URL ?? 'http://localhost:4009',
    analytics: process.env.ANALYTICS_SERVICE_URL ?? 'http://localhost:4010',
    chat: process.env.CHAT_SERVICE_URL ?? 'http://localhost:4011',
    ml: process.env.ML_SERVICE_URL ?? 'http://localhost:4012',
    config: process.env.CONFIG_SERVICE_URL ?? 'http://localhost:4014',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n'),
  },
}));
