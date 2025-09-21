import admin from 'firebase-admin';

declare global {
  var firebaseAdmin: FirebaseAdmin | undefined;
}

class FirebaseAdmin {
  private _firestore: admin.firestore.Firestore;

  private constructor() {
    // Verifica se já existe uma app inicializada
    const existingApp = admin.apps.find(app => app?.name === '[DEFAULT]');
    
    if (!existingApp) {
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

    // Sempre obter a instância do Firestore da app padrão
    this._firestore = admin.firestore();
    this._firestore.settings({
      ignoreUndefinedProperties: true,
      timeout: 10000,
    });
  }

  public static getInstance(): FirebaseAdmin {
    // Em desenvolvimento, usar global para persistir entre hot-reloads
    if (process.env.NODE_ENV === 'development') {
      if (!global.firebaseAdmin) {
        global.firebaseAdmin = new FirebaseAdmin();
      }
      return global.firebaseAdmin;
    }
    
    // Em produção, usar singleton tradicional
    if (!FirebaseAdmin.instance) {
      FirebaseAdmin.instance = new FirebaseAdmin();
    }
    return FirebaseAdmin.instance;
  }

  private static instance: FirebaseAdmin;

  public get firestore(): admin.firestore.Firestore {
    return this._firestore;
  }
}

// Criar a instância singleton
const firebaseAdmin = FirebaseAdmin.getInstance();

// Exportar as instâncias que são usadas no resto da aplicação
export const firestore = firebaseAdmin.firestore;
export const auth = admin.auth;
export default admin; 