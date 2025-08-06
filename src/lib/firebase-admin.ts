import admin from 'firebase-admin';

class FirebaseAdmin {
  private static instance: FirebaseAdmin;
  private _firestore: admin.firestore.Firestore;

  private constructor() {
    if (!admin.apps.length) {
      const credentialsJson = process.env.FB_ADMIN_SDK_CREDENTIALS;
      
      if (!credentialsJson) {
        throw new Error('FB_ADMIN_SDK_CREDENTIALS não encontrada nas variáveis de ambiente');
      }

      const serviceAccount = JSON.parse(credentialsJson);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    this._firestore = admin.firestore();
    this._firestore.settings({
      ignoreUndefinedProperties: true,
    });
  }

  public static getInstance(): FirebaseAdmin {
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin();
    }
    return FirebaseAdmin.instance;
  }

  public get firestore(): admin.firestore.Firestore {
    return this._firestore;
  }
}

const firebaseAdmin = FirebaseAdmin.getInstance();
export const firestore = firebaseAdmin.firestore;
export default admin; 