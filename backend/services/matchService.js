import User from "../models/User.js";
import logger from "../utils/logger.js";

export const getDailyRecommendations = async (userId, limit = 1) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("User not found");

  // 1. Build base query
  const query = buildBaseQuery(user);

  // 2. Find candidates
  let candidates = await findCandidates(query, user);

  // 3. Score and sort candidates
  candidates = scoreAndSortCandidates(candidates, user);

  return candidates.slice(0, limit);
};

// Query Builder
const buildBaseQuery = (user) => {
  const query = {
    _id: { $ne: user._id },
    accountStatus: "active",
    isVerified: true,
  };

  // Gender preference (default to opposite gender)
  query.gender = user.gender === "Male" ? "Female" : "Male";

  // Age range filter
  if (user.partnerAgeMin || user.partnerAgeMax) {
    const minAge = parseInt(user.partnerAgeMin) || 18;
    const maxAge = parseInt(user.partnerAgeMax) || 100;

    query.dateOfBirth = {
      $gte: new Date(new Date().setFullYear(new Date().getFullYear() - maxAge)),
      $lte: new Date(new Date().setFullYear(new Date().getFullYear() - minAge)),
    };
  }

  if (user.skippedUsers && user.skippedUsers.length > 0) {
    query._id = { $nin: [...user.skippedUsers, user._id] }; // Exclude skipped and self
  } else {
    query._id = { $ne: user._id }; // Exclude self
  }

  return query;
};

// Candidate Finder with Fallback
const findCandidates = async (query, user) => {
  let candidates = await User.find(query).lean();

  // First fallback: Relax religion/caste filters
  if (candidates.length === 0) {
    logger.info("No strict matches found, relaxing filters");
    const relaxedQuery = { ...query };
    delete relaxedQuery.religion;
    delete relaxedQuery.caste;
    candidates = await User.find(relaxedQuery).lean();
  }

  // Second fallback: Only essential filters
  if (candidates.length === 0) {
    logger.info("No relaxed matches found, using minimal filters");
    candidates = await User.find({
      _id: { $ne: user._id },
      accountStatus: "active",
      isVerified: true,
    }).lean();
  }

  return candidates;
};

// Scoring Engine
const scoreAndSortCandidates = (candidates, user) => {
  return candidates
    .map((candidate) => {
      let score = 0;

      // Core matching (higher weights)
      if (candidate.religion === user.partnerReligion) score += 3;
      if (candidate.caste === user.partnerCaste) score += 3;

      // Education/occupation matching
      if (candidate.education === user.partnerEducation) score += 2;
      if (candidate.occupation === user.partnerOccupation) score += 2;

      // Profile completeness
      if (candidate.photos?.length > 0) score += 1;
      if (candidate.aboutMe) score += 1;

      // Recent activity bonus
      if (candidate.lastActive) {
        const daysSinceActive =
          (Date.now() - new Date(candidate.lastActive)) / (1000 * 60 * 60 * 24);
        if (daysSinceActive < 7) score += 2;
        else if (daysSinceActive < 30) score += 1;
      }

      return { ...candidate, matchScore: score };
    })
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        new Date(b.lastActive || 0) - new Date(a.lastActive || 0)
    );
};
