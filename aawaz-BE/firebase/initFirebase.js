import admin from 'firebase-admin';

admin.initializeApp({
  // credential: admin.credential.cert(firebase.firebase),
});

export default admin;