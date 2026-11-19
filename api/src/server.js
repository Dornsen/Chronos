import mongoose from 'mongoose';
import { env } from './config/env.js';
import { createApp } from './app.js';

async function start() {
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');

  createApp().listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => console.error('Unhandled rejection', err));
