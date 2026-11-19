export const EVENT_CATEGORIES = Object.freeze(['arrangement', 'reminder', 'task']);

export const MEMBER_ROLES = Object.freeze(['owner', 'editor', 'viewer']);

export const INVITE_STATUSES = Object.freeze(['pending', 'accepted', 'declined']);

// Default length of an arrangement when the client sends no `end`.
export const DEFAULT_ARRANGEMENT_MINUTES = 60;

export const DEFAULT_REGION = 'UA';
export const DEFAULT_CALENDAR_COLOR = '#3b82f6';

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
