import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { DEFAULT_REGION } from '../config/constants.js';
import { User } from '../models/User.js';
import { Calendar } from '../models/Calendar.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores everything after 72 bytes
const HOLIDAYS_COLOR = '#ef4444';

// Compared against when the email is unknown, so login time does not reveal it.
const DUMMY_HASH = bcrypt.hashSync('chronos-dummy-password', BCRYPT_ROUNDS);

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    throw badRequest('Validation failed', { password: 'Password is required' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest('Validation failed', {
      password: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }
  if (Buffer.byteLength(password) > MAX_PASSWORD_LENGTH) {
    throw badRequest('Validation failed', {
      password: `Password must be at most ${MAX_PASSWORD_LENGTH} bytes`,
    });
  }
}

async function createDefaultCalendars(user) {
  const member = { user: user._id, role: 'owner' };

  await Calendar.create([
    { name: 'My calendar', isMain: true, members: [member] },
    {
      name: `Holidays (${user.region})`,
      description: 'National holidays in your region',
      color: HOLIDAYS_COLOR,
      isHolidays: true,
      members: [member],
    },
  ]);
}

export async function register({ email, password, name, region } = {}) {
  validatePassword(password);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = new User({ email, passwordHash, name, region: region || DEFAULT_REGION });

  // Validates the fields before anything is written.
  await user.validate();

  if (await User.exists({ email: user.email })) {
    throw conflict('Email is already registered');
  }

  await user.save();

  try {
    await createDefaultCalendars(user);
  } catch (err) {
    // Standalone MongoDB has no transactions: roll the user back by hand.
    await Promise.all([
      User.deleteOne({ _id: user._id }),
      Calendar.deleteMany({ 'members.user': user._id }),
    ]);
    throw err;
  }

  return { user, token: signToken(user._id) };
}

export async function login({ email, password } = {}) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw badRequest('Validation failed', { email: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !matches) throw unauthorized('Invalid email or password');

  return { user, token: signToken(user._id) };
}
