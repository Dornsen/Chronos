import { User } from '../models/User.js';
import { unauthorized } from '../utils/errors.js';
import { verifyToken } from '../services/authService.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) throw unauthorized();

  const { sub } = verifyToken(token);
  const user = await User.findById(sub);
  if (!user) throw unauthorized('User no longer exists');

  req.user = user;
  next();
}
