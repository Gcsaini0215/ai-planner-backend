'use strict';

const admin = require('firebase-admin');
const path  = require('path');
const logger = require('../utils/logger');

let firebaseApp;

const initFirebase = () => {
  if (admin.apps.length > 0) return admin.app();

  try {
    let credential;

    // ── Option 1: JSON file on disk (local dev) ───────────────────────────
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const fs = require('fs');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
        logger.info(`Firebase: using service account file at ${serviceAccountPath}`);
      } else {
        // File path is set but file doesn't exist (e.g. on Vercel) —
        // fall through to try individual env vars below.
        logger.warn(
          `Firebase service account file not found at "${serviceAccountPath}". ` +
          'Falling back to FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY / FIREBASE_CLIENT_EMAIL env vars.'
        );
      }
    }

    // ── Option 2: Individual env vars (Vercel / CI / production) ─────────
    if (!credential) {
      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL
      ) {
        credential = admin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        });
        logger.info('Firebase: using individual env var credentials');
      }
    }

    // ── No credentials at all ─────────────────────────────────────────────
    if (!credential) {
      logger.warn(
        'No Firebase credentials found. Phone OTP login will not work. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL env vars.'
      );
      return null;
    }

    firebaseApp = admin.initializeApp({ credential });
    logger.info('Firebase Admin SDK initialised successfully');
    return firebaseApp;
  } catch (error) {
    logger.error(`Firebase init error: ${error.message}`);
    return null;
  }
};

/**
 * Verify a Firebase ID token sent from the Flutter client.
 * @param {string} idToken
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
const verifyFirebaseToken = async (idToken) => {
  const app = admin.apps.length > 0 ? admin.app() : initFirebase();
  if (!app) {
    throw new Error(
      'Firebase is not configured on this server. ' +
      'Add firebase-service-account.json to enable phone OTP login.'
    );
  }
  return app.auth().verifyIdToken(idToken);
};

module.exports = { initFirebase, verifyFirebaseToken };
