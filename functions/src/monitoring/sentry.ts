import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Console(),
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  beforeSend(event, hint) {
    // Check if this is an error from a specific service
    if (hint && hint.originalException) {
      event.tags = {
        ...event.tags,
        service: 'peakactivity-functions',
        environment: process.env.NODE_ENV,
      };
    }
    return event;
  },
});

export function captureError(error: Error, context: any = {}) {
  Sentry.withScope(scope => {
    scope.setContext('context', context);
    scope.setTag('userId', context.userId || 'anonymous');
    scope.setTag('action', context.action || 'unknown');
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: Sentry.Severity = 'info', context: any = {}) {
  Sentry.withScope(scope => {
    scope.setContext('context', context);
    scope.setTag('userId', context.userId || 'anonymous');
    scope.setTag('action', context.action || 'unknown');
    Sentry.captureMessage(message, level);
  });
}
