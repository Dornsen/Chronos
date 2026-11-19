import mongoose from 'mongoose';
import { HttpError } from '../utils/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

function toResponse(err) {
  if (err instanceof HttpError) {
    return { status: err.status, body: { error: err.message, details: err.details } };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = {};
    for (const [field, e] of Object.entries(err.errors)) details[field] = e.message;
    return { status: 400, body: { error: 'Validation failed', details } };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { status: 400, body: { error: `Invalid value for "${err.path}"` } };
  }

  // Unique index violation.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    return { status: 409, body: { error: `${field} already exists` } };
  }

  // Malformed JSON body and other body-parser errors.
  if (err.type === 'entity.parse.failed') {
    return { status: 400, body: { error: 'Malformed JSON body' } };
  }
  if (err.status && err.status < 500) {
    return { status: err.status, body: { error: err.message } };
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const mapped = toResponse(err);
  if (mapped) {
    res.status(mapped.status).json(mapped.body);
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
