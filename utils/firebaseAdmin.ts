import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export const getUsersByRole = async (role: string) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("role", "==", role).get();

    if (snapshot.empty) return [];

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username,
        role: data.role,
        createdAt: data.createdAt?.toDate() ?? null,
      };
    });

    return users;
  } catch (error) {
    console.error("Error in getUsersByRole:", error);
    return [];
  }
};

export const getUserByUsername = async (username: string) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("username", "==", username).limit(1).get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (!data.username || !data.password || !data.role) {
      console.warn("Incomplete user data for username:", username);
      return null;
    }

    return {
      id: doc.id,
      username: data.username,
      password: data.password,
      role: data.role as "ketua" | "member",
      createdAt: data.createdAt?.toDate() ?? null,
    };
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    return null;
  }
};

export { db };