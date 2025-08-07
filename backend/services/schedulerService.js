import cron from 'node-cron';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const clearSkippedUsers = async () => {
  try {
    const result = await User.updateMany(
      { 'skippedUsers.0': { '$exists': true } }, // Only update users who have skipped users
      { $set: { skippedUsers: [] } }
    );
    logger.info(`[Scheduler] Cleared skippedUsers for ${result.modifiedCount} users.`);
  } catch (error) {
    logger.error(`[Scheduler] Error clearing skippedUsers: ${error.message}`);
  }
};

export const startSchedulers = () => {
  // Schedule to run every 24 hours (at midnight)
  cron.schedule('0 0 * * *', () => {
    logger.info('[Scheduler] Running daily task: Clearing skipped users.');
    clearSkippedUsers();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Or your desired timezone
  });

  logger.info('[Scheduler] All schedulers started.');
};