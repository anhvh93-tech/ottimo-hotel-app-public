// '@ottimo/integrations/notification' – e-mail adapters for the api worker (README 3.5). Loads nodemailer, so it is
// kept out of the root entry point.
export { MockNotificationAdapter, type MockSentRecord } from './mock.js';
export * from './email-templates.js';
export * from './smtp.js';
