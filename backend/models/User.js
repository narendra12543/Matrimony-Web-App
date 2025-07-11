// User schema

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
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
    email: { type: String, required: true, unique: true },
    phone: { type: String },
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

    // Photos
    photos: [{ type: String }],

    // Auth & System
    password: { type: String, required: false }, // allow null for social login
    passwordResetToken: { type: String }, // for password reset
    passwordResetExpires: { type: Date }, // password reset token expiry
    emailVerificationToken: { type: String }, // for email verification
    emailVerificationExpires: { type: Date }, // email verification token expiry
    isEmailVerified: { type: Boolean, default: false }, // email verification status
    isVerified: { type: Boolean, default: false }, // overall verification status
    verificationDocuments: [{ type: String }],
    subscription: {
      isActive: { type: Boolean, default: false },
      plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
      planName: { type: String },
      activatedAt: { type: Date },
    },
    lastActive: { type: Date },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    socialMediaLogin: { type: Boolean, default: false }, // true if signed up with Google
    googleId: { type: String }, // store Google user id
    skippedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    online: { type: Boolean, default: false },
    profileViews: { type: Number, default: 0 },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);

export default User;
