import mongoose from 'mongoose';
import {
  DEFAULT_CALENDAR_COLOR,
  HEX_COLOR_REGEX,
  MEMBER_ROLES,
} from '../config/constants.js';

const colorField = {
  type: String,
  match: [HEX_COLOR_REGEX, 'Color must be a hex value like #3b82f6'],
};

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBER_ROLES, required: true },
    // Personal settings: each member picks the color of their own events
    // and decides whether the calendar is hidden for themselves.
    eventColor: colorField,
    hidden: { type: Boolean, default: false },
  },
  { _id: false },
);

const calendarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Calendar name is required'],
      trim: true,
      minlength: [1, 'Calendar name is required'],
      maxlength: [100, 'Calendar name must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    color: { ...colorField, default: DEFAULT_CALENDAR_COLOR },
    // Default calendar created together with the user: cannot be removed or hidden.
    isMain: { type: Boolean, default: false },
    // Built-in national holidays calendar: read-only for everyone.
    isHolidays: { type: Boolean, default: false },
    // The owner is stored here with role "owner" (no separate root field).
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true },
);

calendarSchema.index({ 'members.user': 1 });

calendarSchema.path('members').validate(function validateMembers(members) {
  const owners = members.filter((m) => m.role === 'owner');
  return owners.length === 1;
}, 'Calendar must have exactly one owner');

calendarSchema.path('members').validate(function validateUniqueMembers(members) {
  const ids = members.map((m) => String(m.user));
  return new Set(ids).size === ids.length;
}, 'A user can be a member of a calendar only once');

calendarSchema.pre('validate', function checkMainCalendar() {
  if (this.isMain && this.isHolidays) {
    this.invalidate('isHolidays', 'Main calendar cannot be a holidays calendar');
  }
  if (this.isMain && this.members.some((m) => m.hidden)) {
    this.invalidate('members', 'Main calendar cannot be hidden');
  }
});

calendarSchema.virtual('owner').get(function getOwner() {
  return this.members.find((m) => m.role === 'owner')?.user;
});

calendarSchema.methods.getMember = function getMember(userId) {
  return this.members.find((m) => String(m.user) === String(userId));
};

calendarSchema.methods.roleOf = function roleOf(userId) {
  return this.getMember(userId)?.role ?? null;
};

calendarSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret.id;
    delete ret.__v;
    return ret;
  },
});

export const Calendar = mongoose.model('Calendar', calendarSchema);
