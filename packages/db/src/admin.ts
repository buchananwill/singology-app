export { createAdminDbFromEnv } from "./adminDbFromEnv";
export { magicLinkTokenFor } from "./authAdmin";
export { connectionSettingsFromUrl, createAdminDb, type Db, withAdminDb } from "./client";
export { assertTestEnv, requireEnv, supabaseUrlFrom } from "./env";
export {
  type ClaimedNotification,
  createNotificationQueue,
  type DueNotification,
  type FeedbackReadyDue,
  type NewSubmissionDue,
  type NotificationQueue,
  type NotificationRow,
  type PracticeReminderDue,
  type Recipient,
  type RecipientQuery,
  type RecipientRow,
  type SentLogKey,
} from "./notificationQueue";
export { notifications } from "./schema";
export { CTO_DISPLAY_NAME, E2E_EMAILS, E2E_TESTERS, type E2eTester } from "./seed/alphaCast";
export { reseedTestProject } from "./seed/seedFromEnv";
export type { UserId } from "./seed/userIdByEmail";
