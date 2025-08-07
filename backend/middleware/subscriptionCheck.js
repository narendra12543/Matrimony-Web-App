import User from '../models/User.js';
import logger from '../utils/logger.js';

export const checkSubscriptionAndTrial = async (req, res, next) => {
  if (!req.user) {
    return next(); // No user, continue
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check and update trial status
    if (user.trial.isActive && user.trial.endDate < new Date()) {
      user.trial.isActive = false;
      await user.save();
      logger.info(`User ${user._id} trial expired and deactivated.`);
    }

    // Attach updated user object to request
    req.user = user; 
    next();
  } catch (error) {
    logger.error(`Error in checkSubscriptionAndTrial middleware: ${error.message}`);
    res.status(500).json({ message: 'Server error during subscription check' });
  }
};

export const checkFeatureAccess = (feature) => (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const isPremium = user.subscription?.isActive;
  const isTrial = user.trial?.isActive;
  const planName = user.subscription?.planName;

  let hasAccess = false;

  switch (feature) {
    case 'voiceCall':
      hasAccess = isTrial || isPremium; // All premium/trial users get voice call
      break;
    case 'videoCall':
      hasAccess = isTrial || (isPremium && planName === '999 Plan'); // Only 999 plan and trial get video call
      break;
    case 'profileVisits':
      hasAccess = isTrial || isPremium; // All premium/trial users get profile visits
      break;
    case 'unlimitedRequests':
      hasAccess = isTrial || (isPremium && planName === '999 Plan'); // Only 999 plan and trial get unlimited requests
      break;
    default:
      hasAccess = false; // Unknown feature, deny access
  }

  if (hasAccess) {
    next();
  } else {
    res.status(403).json({ message: `Access to ${feature} requires a premium subscription or active trial.` });
  }
};

export const checkConnectionRequestLimit = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const isPremium = user.subscription?.isActive;
  const isTrial = user.trial?.isActive;
  const planName = user.subscription?.planName;

  // Unlimited requests for Elite/VIP users (Elite Plan) and trial users
  if (isTrial || (isPremium && planName === 'Elite')) {
    return next();
  }

  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  if (!user.lastConnectionRequestWeek || new Date(user.lastConnectionRequestWeek) < startOfWeek) {
    user.connectionRequestsThisWeek = 0;
    user.lastConnectionRequestWeek = startOfWeek;
    await user.save(); // Save the user object after resetting the count
  }

  let limit = 0;
  let plan = "Basic";

  if (isPremium && planName === 'Premium') {
    limit = 10;
    plan = "Premium";
  } else {
    limit = 3;
    plan = "Basic";
  }

  if (user.connectionRequestsThisWeek >= limit) {
    return res.status(403).json({ message: `Weekly connection request limit reached (${limit} per week for ${plan} users).` });
  }

  req.requestLimit = limit;
  req.planName = plan;
  next();
};

export const checkCallFeatureAccess = (req, res, next) => {
  const { callType } = req.body;
  if (!callType) {
    return res.status(400).json({ message: 'Call type is required.' });
  }

  if (callType === 'video') {
    return checkFeatureAccess('videoCall')(req, res, next);
  } else if (callType === 'voice') {
    return checkFeatureAccess('voiceCall')(req, res, next);
  } else {
    return res.status(400).json({ message: 'Invalid call type.' });
  }
};
