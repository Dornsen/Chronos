import mongoose from 'mongoose';
import {
  DEFAULT_ARRANGEMENT_MINUTES,
  EMAIL_REGEX,
  EVENT_CATEGORIES,
  INVITE_STATUSES,
} from '../config/constants.js';

const inviteeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Invitee email is invalid'],
    },
    // Filled when the invited email belongs to a registered user.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: INVITE_STATUSES, default: 'pending' },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    calendar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calendar',
      required: [true, 'Calendar is required'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: { values: EVENT_CATEGORIES, message: 'Category must be arrangement, reminder or task' },
      required: [true, 'Category is required'],
    },
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [150, 'Event name must be at most 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },
    // Required for every category: arrangement start, reminder time, task deadline/day.
    start: { type: Date, required: [true, 'Start date is required'] },
    // Always set before save: see the pre-validate hook below.
    end: { type: Date },
    allDay: { type: Boolean, default: false },
    // arrangement only
    location: { type: String, trim: true, maxlength: 200 },
    // task only
    done: { type: Boolean, default: false },
    invitees: { type: [inviteeSchema], default: [] },
  },
  { timestamps: true },
);

// Calendar grid queries: events of calendar(s) in a date range.
eventSchema.index({ calendar: 1, start: 1, end: 1 });
// Search bar.
eventSchema.index({ name: 'text', description: 'text' });

eventSchema.pre('validate', function normalizeEnd() {
  if (!this.start) return;

  if (!this.end) {
    this.end = this.category === 'arrangement'
      ? new Date(this.start.getTime() + DEFAULT_ARRANGEMENT_MINUTES * 60_000)
      : this.start;
  }

  if (this.end < this.start) {
    this.invalidate('end', 'End date cannot be before start date');
  }

  if (this.category !== 'arrangement') this.location = undefined;
  if (this.category !== 'task') this.done = undefined;
});

eventSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Event = mongoose.model('Event', eventSchema);
