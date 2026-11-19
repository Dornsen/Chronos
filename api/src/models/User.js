import mongoose from 'mongoose';
import { DEFAULT_REGION, EMAIL_REGEX } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Email is invalid'],
    },
    // Never returned by default; select it explicitly on login.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    // ISO 3166-1 alpha-2 country code, used to pick national holidays.
    region: {
      type: String,
      default: DEFAULT_REGION,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{2}$/, 'Region must be a 2-letter country code'],
    },
    avatar: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
