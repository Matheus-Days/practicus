import { doc, getDoc } from "firebase/firestore";
import { useFirebase } from "./firebase";
import { UserData } from "./firebase";

export const useUserAPI = () => {
  const { firestore } = useFirebase();

  const getUserData = async (uid: string): Promise<UserData | null> => {
    try {
      const userDocRef = doc(firestore, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return {
          uid,
          ...userDoc.data(),
        } as UserData;
      }

      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      throw error;
    }
  };

  return { getUserData };
};
