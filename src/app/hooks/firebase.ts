import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  Firestore,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { useMemo, useCallback } from "react";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const credentialsJson = process.env.NEXT_PUBLIC_FB_SDK_CREDENTIALS;

if (!credentialsJson) {
  throw new Error(
    "NEXT_PUBLIC_FB_SDK_CREDENTIALS not found in environment variables"
  );
}

const firebaseConfig: FirebaseConfig = JSON.parse(credentialsJson);

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Interface for user data
export interface UserData {
  uid: string;
  admin?: boolean;
  email?: string;
  displayName?: string;
  [key: string]: any;
}


export const useFirebase = () => {
  const auth = useMemo(() => getAuth(app), []);
  const firestore = useMemo(() => getFirestore(app), []);
  const storage = useMemo(() => getStorage(app), []);


  // Função para obter token de ID do usuário autenticado
  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      console.error("Error getting ID token:", error);
      return null;
    }
  }, [auth]);

  return {
    auth,
    firestore,
    storage,
    getIdToken,
  };
};

// Export useful types
export type { Auth, Firestore };
