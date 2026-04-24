import rateLimit from 'express-rate-limit';

// Per-user: 10 requests per hour
export const chatbotUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req: any) => req.userId ?? req.ip,
  message: {
    status: 429,
    message: 'Rate limit exceeded. You can send 10 messages per hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global: 30 requests per hour across all users
export const chatbotGlobalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: () => 'global',
  message: {
    status: 429,
    message: 'Global rate limit reached. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
