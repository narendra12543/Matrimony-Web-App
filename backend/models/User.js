import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    firstName: { type: String, required: true },
    lastName: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    height: { type: String },
    weight: { type: String },
    maritalStatus: { type: String },
    religion: { type: String },
    caste: { type: String },
    motherTongue: { type: String },
    manglik: { type: String },
    bodyType: { type: String },
    complexion: { type: String },
    physicalStatus: { type: String },

    // Contact & Location
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String },
    uniqueId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values
    },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    residentialStatus: { type: String },

    // Professional
    education: { type: String },
    educationDetails: { type: String },
    occupation: { type: String },
    occupationDetails: { type: String },
    annualIncome: { type: String },
    workLocation: { type: String },

    // Family
    familyType: { type: String },
    familyStatus: { type: String },
    familyValues: { type: String },
    fatherOccupation: { type: String },
    motherOccupation: { type: String },
    siblings: { type: String },
    familyLocation: { type: String },

    // Lifestyle
    diet: { type: String },
    smoking: { type: String },
    drinking: { type: String },
    hobbies: { type: String },
    interests: { type: String },

    // About
    aboutMe: { type: String },

    // Partner Preferences
    partnerGender: {
      type: String,
      enum: ["Male", "Female", "Other", "Any Gender", ""],
      default: "",
    },
    partnerAgeMin: { type: String },
    partnerAgeMax: { type: String },
    partnerHeightMin: { type: String },
    partnerHeightMax: { type: String },
    partnerEducation: { type: String },
    partnerOccupation: { type: String },
    partnerIncome: { type: String },
    partnerLocation: { type: String },
    partnerReligion: { type: String },
    partnerCaste: { type: String },
    partnerMaritalStatus: { type: String },
    partnerAbout: { type: String },

    // Partner Preferences Object (for the separate preferences page)
    partnerPreferences: {
      partnerGender: { type: String, default: "" },
      partnerAgeMin: { type: String, default: "" },
      partnerAgeMax: { type: String, default: "" },
      partnerHeightMin: { type: String, default: "" },
      partnerHeightMax: { type: String, default: "" },
      partnerEducation: { type: String, default: "" },
      partnerOccupation: { type: String, default: "" },
      partnerIncome: { type: String, default: "" },
      partnerCountry: { type: String, default: "" },
      partnerLocation: { type: String, default: "" },
      partnerReligion: { type: String, default: "" },
      partnerCaste: { type: String, default: "" },
      partnerMaritalStatus: { type: String, default: "" },
      partnerAbout: { type: String, default: "" },
    },

    // Photos
    photos: [{ type: String }],

    // Auth & System
    password: { type: String, required: false, default: "" },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    isNewUser: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    essentialProfileComplete: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    pendingChanges: { type: Object, default: {} },
    subscription: {
      isActive: { type: Boolean, default: false },
      plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
      planName: { type: String },
      activatedAt: { type: Date },
      expiresAt: { type: Date },
    },
    trial: {
      startDate: { type: Date },
      endDate: { type: Date },
      isActive: { type: Boolean, default: false },
    },
    connectionRequestsToday: { type: Number, default: 0 },
    lastConnectionRequestDate: { type: Date },
    connectionRequestsThisWeek: { type: Number, default: 0 },
    lastConnectionRequestWeek: { type: Date },
    lastActive: { type: Date },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    socialMediaLogin: { type: Boolean, default: false },
    googleId: { type: String },
    subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscriber" },
    skippedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    online: { type: Boolean, default: false },
    profileViews: { type: Number, default: 0 },

    // Privacy Settings
    privacy: {
      profileVisibility: {
        type: String,
        enum: ["public", "premium-only", "private"],
        default: "public",
      },
      contactVisibility: {
        type: String,
        enum: ["premium-only", "verified-only", "all"],
        default: "premium-only",
      },
      dataUsage: { type: Boolean, default: true },
      marketingCommunications: { type: Boolean, default: false },
    },
    cleanupPending: { type: Boolean, default: false },
    actionLog: [{ action: String, date: Date }],

    // --- INTEGRATED NOTIFICATION SETTINGS ---
    notificationSettings: {
    push: {
          instantMessages: { type: Boolean, default: true },
          newMatches: { type: Boolean, default: true },
          reminders: { type: Boolean, default: true }
        },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password || this.password === "") {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
