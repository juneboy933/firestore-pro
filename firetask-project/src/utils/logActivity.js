// utils/logActivity.js
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export const logActivity = async ({ projectId, message, performedBy, userEmail }) => {
  try {
    await addDoc(collection(db, "activity_logs"), {
      projectId,
      message,
      performedBy,
      userEmail,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};
