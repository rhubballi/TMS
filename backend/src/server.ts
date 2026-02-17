import dotenv from "dotenv";
import { initOverdueTracker } from './services/cronService';
import { checkExpiredCertificates } from './services/schedulerService';
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";

const PORT = parseInt(process.env.PORT || "4000", 10);

// Connect to MongoDB
connectDB().then(() => {
  // Start background services
  initOverdueTracker();
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT} `);

  // Sprint 3: Register expiry scheduler
  // Run every 6 hours (21600000 ms) to check for expired certificates
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  setInterval(async () => {
    console.log('[Sprint3] Running scheduled expiry check...');
    await checkExpiredCertificates();
  }, SIX_HOURS_MS);

  // Run once on startup after 10 seconds
  setTimeout(async () => {
    console.log('[Sprint3] Running initial expiry check on startup...');
    await checkExpiredCertificates();
  }, 10000);
});

server.setTimeout(300000); // 5 minutes timeout

import fs from 'fs';
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  fs.appendFileSync('crash.log', `\n${new Date().toISOString()} - UNCAUGHT EXCEPTION: ${err.message} \n${err.stack} \n`);
  process.exit(1); // Optional, but usually safer to restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  fs.appendFileSync('crash.log', `\n${new Date().toISOString()} - UNHANDLED REJECTION: ${reason} \n`);
});
