import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export enum UserRole {
  // Admin Roles
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  CONTENT_MANAGER = 'content_manager',
  SUPPORT_STAFF = 'support_staff',
  
  // Instructor Roles
  INSTRUCTOR = 'instructor',
  ASSISTANT_INSTRUCTOR = 'assistant_instructor',
  GUEST_INSTRUCTOR = 'guest_instructor',
  
  // Student Roles
  STUDENT = 'student',
  PREMIUM_STUDENT = 'premium_student',
  TRIAL_STUDENT = 'trial_student',
  
  // Additional Roles
  REVIEWER = 'reviewer',
  ANALYST = 'analyst',
  FINANCE_MANAGER = 'finance_manager'
}

export interface IUser extends Document {
  // --- Core Fields (existing) ---
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: string[];
  isActive: boolean;
  profileImage?: string;
  bio?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  enrolledCourses: mongoose.Types.ObjectId[];
  completedCourses: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;

  // --- NEW: Email Verification ---
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;

  // --- NEW: Password Reset ---
  passwordResetToken?: string;
  passwordResetExpiry?: Date;

  // --- NEW: Account Security ---
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  lastLoginIP?: string;

  // --- NEW: OAuth ---
  googleId?: string;
  githubId?: string;
  authProvider: 'local' | 'google' | 'github';

  // --- NEW: Refresh Tokens ---
  refreshTokens: string[];

  // --- NEW: Referral System ---
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  referralRewards: number;

  // --- NEW: Subscription ---
  subscriptionPlan: 'free' | 'monthly' | 'yearly';
  subscriptionExpiry?: Date;

  // --- Methods ---
  isLocked(): boolean;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
}

const UserSchema: Schema = new Schema({
  // --- Core Fields (unchanged) ---
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false }, // Not required for OAuth users
  role: { type: String, enum: Object.values(UserRole), default: UserRole.STUDENT },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  profileImage: { type: String },
  bio: { type: String },
  phone: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  completedCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],

  // --- Email Verification ---
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpiry: { type: Date, select: false },

  // --- Password Reset ---
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },

  // --- Account Security ---
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  lastLoginIP: { type: String },

  // --- OAuth ---
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },
  authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },

  // --- Refresh Tokens (store hashed tokens) ---
  refreshTokens: { type: [String], select: false, default: [] },

  // --- Referral System ---
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  referralRewards: { type: Number, default: 0 },

  // --- Subscription ---
  subscriptionPlan: { type: String, enum: ['free', 'monthly', 'yearly'], default: 'free' },
  subscriptionExpiry: { type: Date },

}, { timestamps: true }); // Use built-in Mongoose timestamps

// ── Methods ───────────────────────────────────────────────────────────────────

// Check if account is currently locked
UserSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Generate a secure email verification token
UserSchema.methods.generateEmailVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token; // Return unhashed token (sent in email)
};

// Generate a secure password reset token
UserSchema.methods.generatePasswordResetToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token; // Return unhashed token (sent in email)
};

// Auto-generate a unique referral code before saving
UserSchema.pre('save', async function() {
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
});

export default mongoose.model<IUser>('User', UserSchema);
