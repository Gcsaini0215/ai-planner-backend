'use strict';

const admin = require('firebase-admin');
const path  = require('path');
const logger = require('../utils/logger');

let firebaseApp;

const initFirebase = () => {
  if (admin.apps.length > 0) return admin.app();

  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Option 1 – service account JSON file (recommended for local dev)
      const serviceAccountPath = path.resolve(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      );

      // Check the file exists before requiring it
      const fs = require('fs');
      if (!fs.existsSync(serviceAccountPath)) {
        logger.warn(
          `Firebase service account file not found at "${serviceAccountPath}". ` +
          'Firebase Auth (phone OTP login) will be unavailable. ' +
          'Dev-login still works without it. ' +
          'See README for how to download the file from Firebase Console.'
        );
        return null;
      }

      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      // Option 2 – individual env vars (CI / cloud environments)
      credential = admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });
    } else {
      logger.warn(
        'No Firebase credentials configured. ' +
        'Firebase Auth (phone OTP login) will be unavailable. ' +
        'Dev-login still works without it.'
      );
      return null;
    }

    firebaseApp = admin.initializeApp({ credential });
    logger.info('Firebase Admin SDK initialised');
    return firebaseApp;
  } catch (error) {
    logger.error(`Firebase init error: ${error.message}`);
    // Don't crash the server — Firebase is only needed for phone OTP login
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
