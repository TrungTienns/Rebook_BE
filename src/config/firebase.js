const admin = require('firebase-admin');

try {
  const serviceAccount = require('./serviceAccountKey.json');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.warn('Firebase Warning: Không tìm thấy file serviceAccountKey.json hoặc cấu hình lỗi. Firebase Auth sẽ không hoạt động.', error.message);
}

module.exports = admin;
