import * as authService from '../services/authService.js';

export async function register(req, res) {
  const { user, token } = await authService.register(req.body ?? {});
  res.status(201).json({ user, token });
}

export async function login(req, res) {
  const { user, token } = await authService.login(req.body ?? {});
  res.json({ user, token });
}

export function me(req, res) {
  res.json({ user: req.user });
}
