import User from "../models/User.js";
import logger from "../utils/logger.js";

// Define a maximum possible score for percentage calculation
const MAX_SCORE = 127; // This will be refined based on the sum of all max weights

export const getDailyRecommendations = async (userId, limit = 7) => {
  logger.info(
    `[MatchService] Fetching daily recommendations for user: ${userId}`
  );
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // 1. Build base query
  const query = buildBaseQuery(user);
  logger.info(
    `[MatchService] Base query built for user ${userId}: ${JSON.stringify(
      query
    )}`
  );

  // 2. Find candidates
  const { candidates, fallbackTriggered } = await findCandidates(query, user);
  logger.info(
    `[MatchService] Found ${candidates.length} candidates after initial filtering for user ${userId}. Fallback triggered: ${fallbackTriggered}`
  );

  // 3. Score and sort candidates
  const scoredCandidates = scoreAndSortCandidates(candidates, user);
  logger.info(
    `[MatchService] Scored and sorted ${scoredCandidates.length} candidates for user ${userId}.`
  );

  return { profiles: scoredCandidates.slice(0, limit), fallbackTriggered };
};

export const getMatchedUsers = async (userId) => {
  logger.info(`[MatchService] Fetching matched users for user: ${userId}`);
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  logger.info(
    `[MatchService] User ${userId} preferences: Gender=${user.partnerGender}, Age=${user.partnerAgeMin}-${user.partnerAgeMax}, Religion=${user.partnerReligion}, Caste=${user.partnerCaste}`
  );

  const query = buildBaseQuery(user);
  logger.info(
    `[MatchService] Base query built for user ${userId}: ${JSON.stringify(
      query
    )}`
  );

  const { candidates, fallbackTriggered } = await findCandidates(query, user);
  logger.info(
    `[MatchService] Found ${candidates.length} candidates after initial filtering for user ${userId}. Fallback triggered: ${fallbackTriggered}`
  );

  const scoredCandidates = scoreAndSortCandidates(candidates, user);
  logger.info(
    `[MatchService] Scored and sorted ${scoredCandidates.length} candidates for user ${userId}.`
  );

  return { profiles: scoredCandidates, fallbackTriggered };
};

// Query Builder
const buildBaseQuery = (user) => {
  const query = {
    _id: { $ne: user._id },
    accountStatus: "active",
    isVerified: true,
    approvalStatus: "approved", // Only include admin-approved users
  };

  // Gender preference
  if (user.partnerGender && user.partnerGender !== "Any Gender") {
    query.gender = user.partnerGender;
  } else {
    // Default to opposite gender if no specific preference or 'Any Gender'
    query.gender = user.gender === "Male" ? "Female" : "Male";
  }

  // Age range filter
  if (user.partnerAgeMin && user.partnerAgeMax) {
    const minAge = parseInt(user.partnerAgeMin);
    const maxAge = parseInt(user.partnerAgeMax);

    query.dateOfBirth = {
      $gte: new Date(new Date().setFullYear(new Date().getFullYear() - maxAge)),
      $lte: new Date(new Date().setFullYear(new Date().getFullYear() - minAge)),
    };
  }

  // Location filters
  if (user.partnerCountry && user.partnerCountry !== "Any Country") {
    query.country = user.partnerCountry;
  }
  if (user.partnerLocation && user.partnerLocation !== "Any State") {
    query.state = user.partnerLocation;
  }

  // Religion and Caste filters (only apply if not "Any")
  if (user.partnerReligion && user.partnerReligion !== "Any Religion") {
    query.religion = user.partnerReligion;
  }
  if (user.partnerCaste && user.partnerCaste.toLowerCase() !== "any") {
    query.caste = user.partnerCaste;
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
  let candidates = await User.find(query).select("+uniqueId");
  let fallbackTriggered = false;

  // Helper to create a base query for fallbacks, always excluding self and skipped users
  const getBaseFallbackQuery = () => {
    const baseQuery = {
      accountStatus: "active",
      isVerified: true,
      approvalStatus: "approved", // Maintain approvalStatus check in fallbacks
    };
    if (user.skippedUsers && user.skippedUsers.length > 0) {
      baseQuery._id = { $nin: [...user.skippedUsers, user._id] };
    } else {
      baseQuery._id = { $ne: user._id };
    }
    return baseQuery;
  };

  // First fallback: Relax religion/caste filters if no matches
  if (candidates.length === 0) {
    logger.info("No strict matches found, relaxing religion/caste filters");
    const relaxedQuery = { ...query };
    if (relaxedQuery.religion) delete relaxedQuery.religion;
    if (relaxedQuery.caste) delete relaxedQuery.caste;
    candidates = await User.find(relaxedQuery).select("+uniqueId");
  }

  // Second fallback: Relax location filters if no matches
  if (candidates.length === 0) {
    logger.info(
      "No relaxed religion/caste matches found, relaxing location filters"
    );
    const relaxedQuery = { ...query };
    if (relaxedQuery.country) delete relaxedQuery.country;
    if (relaxedQuery.state) delete relaxedQuery.state;
    // Ensure religion/caste are still relaxed if they were before
    if (relaxedQuery.religion) delete relaxedQuery.religion;
    if (relaxedQuery.caste) delete relaxedQuery.caste;
    candidates = await User.find(relaxedQuery).select("+uniqueId");
  }

  // Third fallback: Only essential filters, but still exclude skipped users and maintain gender
  if (candidates.length === 0) {
    logger.info("No relaxed matches found, using minimal filters");
    const minimalQuery = getBaseFallbackQuery();
    minimalQuery.gender = query.gender; // Explicitly re-add gender filter
    candidates = await User.find(minimalQuery).select("+uniqueId");
  }

  // Fourth fallback: If still no candidates, try finding any active, verified user not yet skipped
  if (candidates.length === 0) {
    logger.info(
      "Still no matches, trying to find any active, verified user not yet skipped."
    );
    const minimalQueryNotSkipped = getBaseFallbackQuery(); // This already excludes skipped users
    minimalQueryNotSkipped.gender = query.gender; // Re-add gender filter
    candidates = await User.find(minimalQueryNotSkipped).select("+uniqueId");
    fallbackTriggered = true;
  }

  // Fifth (absolute last) fallback: If still no candidates, re-introduce previously skipped users
  if (candidates.length === 0) {
    logger.info(
      "Still no matches, re-introducing previously skipped users as an absolute last resort."
    );
    candidates = await User.find({
      _id: { $ne: user._id },
      accountStatus: "active",
      isVerified: true,
      gender: query.gender, // Ensure gender filter is always applied
    }).select("+uniqueId");
    fallbackTriggered = true;
  }

  return { candidates, fallbackTriggered };
};

// Scoring Engine
const scoreAndSortCandidates = (candidates, user) => {
  logger.info(
    `[MatchService] Starting scoring process for ${candidates.length} candidates for user: ${user._id}`
  );
  candidates.forEach((candidate) => {
    let score = 0;
    logger.info(`[MatchService] --- Scoring candidate: ${candidate._id} ---`);
    if (
      user.partnerReligion &&
      user.partnerReligion !== "Any Religion" &&
      candidate.religion === user.partnerReligion
    ) {
      score += 10;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched religion. Score: ${score}`
      );
    }
    if (
      user.partnerCaste &&
      user.partnerCaste.toLowerCase() !== "any" &&
      candidate.caste === user.partnerCaste
    ) {
      score += 10;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched caste. Score: ${score}`
      );
    }
    if (user.partnerAgeMin && user.partnerAgeMax && candidate.dateOfBirth) {
      const userMinAge = parseInt(user.partnerAgeMin);
      const userMaxAge = parseInt(user.partnerAgeMax);
      const candidateAge =
        new Date().getFullYear() -
        new Date(candidate.dateOfBirth).getFullYear();
      if (candidateAge >= userMinAge && candidateAge <= userMaxAge) {
        score += 10;
        logger.info(
          `[MatchService] Candidate ${candidate._id}: Age within preferred range. Score: ${score}`
        );
      } else if (
        candidateAge >= userMinAge - 5 &&
        candidateAge <= userMaxAge + 5
      ) {
        score += 5;
        logger.info(
          `[MatchService] Candidate ${candidate._id}: Age slightly outside preferred range. Score: ${score}`
        );
      }
    }
    if (user.partnerHeightMin && user.partnerHeightMax && candidate.height) {
      const parseHeight = (heightStr) => {
        const parts = heightStr.match(/(\d+)\'(\d+)\"/);
        if (parts) {
          const feet = parseInt(parts[1]);
          const inches = parseInt(parts[2]);
          return feet * 12 + inches;
        }
        return 0;
      };
      const userMinHeightInches = parseHeight(user.partnerHeightMin);
      const userMaxHeightInches = parseHeight(user.partnerHeightMax);
      const candidateHeightInches = parseHeight(candidate.height);
      if (
        candidateHeightInches >= userMinHeightInches &&
        candidateHeightInches <= userMaxHeightInches
      ) {
        score += 7;
        logger.info(
          `[MatchService] Candidate ${candidate._id}: Height within preferred range. Score: ${score}`
        );
      } else if (
        candidateHeightInches >= userMinHeightInches - 3 &&
        candidateHeightInches <= userMaxHeightInches + 3
      ) {
        score += 3;
        logger.info(
          `[MatchService] Candidate ${candidate._id}: Height slightly outside preferred range. Score: ${score}`
        );
      }
    }
    if (
      user.partnerEducation &&
      user.partnerEducation !== "Any Education" &&
      candidate.education === user.partnerEducation
    ) {
      score += 7;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched education. Score: ${score}`
      );
    }
    if (
      user.partnerOccupation &&
      user.partnerOccupation !== "Any Occupation" &&
      candidate.occupation === user.partnerOccupation
    ) {
      score += 7;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched occupation. Score: ${score}`
      );
    }
    if (
      user.partnerIncome &&
      user.partnerIncome !== "Any Income Range" &&
      candidate.annualIncome === user.partnerIncome
    ) {
      score += 7;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched income. Score: ${score}`
      );
    }
    if (
      user.partnerCountry &&
      user.partnerCountry !== "Any Country" &&
      candidate.country === user.partnerCountry
    ) {
      score += 7;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched country. Score: ${score}`
      );
    }
    if (
      user.partnerLocation &&
      user.partnerLocation !== "Any State" &&
      candidate.state === user.partnerLocation
    ) {
      score += 7;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched state. Score: ${score}`
      );
    }
    if (
      user.partnerMaritalStatus &&
      user.partnerMaritalStatus !== "Any Status" &&
      candidate.maritalStatus === user.partnerMaritalStatus
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched marital status. Score: ${score}`
      );
    }
    if (user.partnerBodyType && candidate.bodyType === user.partnerBodyType) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched body type. Score: ${score}`
      );
    }
    if (
      user.partnerComplexion &&
      candidate.complexion === user.partnerComplexion
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched complexion. Score: ${score}`
      );
    }
    if (
      user.partnerPhysicalStatus &&
      candidate.physicalStatus === user.partnerPhysicalStatus
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched physical status. Score: ${score}`
      );
    }
    if (
      user.partnerFamilyType &&
      candidate.familyType === user.partnerFamilyType
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched family type. Score: ${score}`
      );
    }
    if (
      user.partnerFamilyStatus &&
      candidate.familyStatus === user.partnerFamilyStatus
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched family status. Score: ${score}`
      );
    }
    if (
      user.partnerFamilyValues &&
      candidate.familyValues === user.partnerFamilyValues
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched family values. Score: ${score}`
      );
    }
    if (
      user.partnerFatherOccupation &&
      candidate.fatherOccupation === user.partnerFatherOccupation
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched father's occupation. Score: ${score}`
      );
    }
    if (
      user.partnerMotherOccupation &&
      candidate.motherOccupation === user.partnerMotherOccupation
    ) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched mother's occupation. Score: ${score}`
      );
    }
    if (user.partnerSiblings && candidate.siblings === user.partnerSiblings) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched siblings. Score: ${score}`
      );
    }
    if (user.partnerDiet && candidate.diet === user.partnerDiet) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched diet. Score: ${score}`
      );
    }
    if (user.partnerSmoking && candidate.smoking === user.partnerSmoking) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched smoking preference. Score: ${score}`
      );
    }
    if (user.partnerDrinking && candidate.drinking === user.partnerDrinking) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Matched drinking preference. Score: ${score}`
      );
    }
    const userHobbies = user.hobbies
      ? user.hobbies.split(",").map((s) => s.trim().toLowerCase())
      : [];
    const userInterests = user.interests
      ? user.interests.split(",").map((s) => s.trim().toLowerCase())
      : [];
    const candidateHobbies = candidate.hobbies
      ? candidate.hobbies.split(",").map((s) => s.trim().toLowerCase())
      : [];
    const candidateInterests = candidate.interests
      ? candidate.interests.split(",").map((s) => s.trim().toLowerCase())
      : [];
    const sharedHobbies = userHobbies.filter((hobby) =>
      candidateHobbies.includes(hobby)
    );
    const sharedInterests = userInterests.filter((interest) =>
      candidateInterests.includes(interest)
    );
    const hobbyPoints = Math.min(sharedHobbies.length, 5) * 1;
    const interestPoints = Math.min(sharedInterests.length, 5) * 1;
    score += hobbyPoints;
    score += interestPoints;
    if (hobbyPoints > 0)
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Shared hobbies. Points: ${hobbyPoints}. Score: ${score}`
      );
    if (interestPoints > 0)
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Shared interests. Points: ${interestPoints}. Score: ${score}`
      );
    if (candidate.photos?.length > 0) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Has photos. Score: ${score}`
      );
    }
    if (candidate.aboutMe) {
      score += 3;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Has 'about me'. Score: ${score}`
      );
    }
    if (candidate.lastActive) {
      const daysSinceActive =
        (Date.now() - new Date(candidate.lastActive)) / (1000 * 60 * 60 * 24);
      if (daysSinceActive < 7) {
        score += 3;
        logger.info(
          `[MatchService] Candidate ${candidate._id}: Recently active (<7 days). Score: ${score}`
        );
      } else if (daysSinceActive < 30) {
        score += 1;
        logger.info(
          `[MatchService] Candidate ${candidate._id}: Recently active (<30 days). Score: ${score}`
        );
      }
    }
    if (
      candidate.partnerReligion &&
      candidate.partnerReligion !== "Any Religion" &&
      user.religion === candidate.partnerReligion
    ) {
      score += 5;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Mutual religion preference. Score: ${score}`
      );
    }
    if (
      candidate.partnerCaste &&
      candidate.partnerCaste.toLowerCase() !== "any" &&
      user.caste === candidate.partnerCaste
    ) {
      score += 5;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Mutual caste preference. Score: ${score}`
      );
    }
    if (
      candidate.partnerCountry &&
      candidate.partnerCountry !== "Any Country" &&
      user.country === candidate.partnerCountry
    ) {
      score += 5;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Mutual country preference. Score: ${score}`
      );
    }
    if (
      candidate.partnerLocation &&
      candidate.partnerLocation !== "Any State" &&
      user.state === candidate.partnerLocation
    ) {
      score += 5;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Mutual state preference. Score: ${score}`
      );
    }
    if (
      candidate.partnerEducation &&
      candidate.partnerEducation !== "Any Education" &&
      user.education === candidate.partnerEducation
    ) {
      score += 5;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Mutual education preference. Score: ${score}`
      );
    }
    if (
      candidate.partnerOccupation &&
      candidate.partnerOccupation !== "Any Occupation" &&
      user.occupation === candidate.partnerOccupation
    ) {
      score += 5;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Mutual occupation preference. Score: ${score}`
      );
    }
    if (
      candidate.partnerMaritalStatus &&
      candidate.partnerMaritalStatus !== "Any Status" &&
      user.maritalStatus === candidate.partnerMaritalStatus
    ) {
      score += 5;
      logger.info(
        `[MatchService] Candidate ${candidate._id}: Mutual marital status preference. Score: ${score}`
      );
    }
    candidate.matchScore = score;
    candidate.matchPercentage = Math.min(
      100,
      Math.round((score / MAX_SCORE) * 100)
    );
    logger.info(
      `[MatchService] Final score for candidate ${candidate._id}: ${candidate.matchScore}, Percentage: ${candidate.matchPercentage}%`
    );
  });
  return candidates
    .map((candidate) => ({
      ...candidate.toObject(),
      _id: candidate._id.toString(),
      matchScore: candidate.matchScore,
      matchPercentage: candidate.matchPercentage,
    }))
    .sort(
      (a, b) =>
        b.matchPercentage - a.matchPercentage ||
        new Date(b.lastActive || 0) - new Date(a.lastActive || 0)
    );
};
