import { database } from "./firebase";
import { ref, push, set, get, query, orderByChild, limitToLast } from "firebase/database";

export interface UserActivity {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  page: string;
  timestamp: number;
}

export async function trackActivity(activity: Omit<UserActivity, "id" | "timestamp">): Promise<void> {
  try {
    const activitiesRef = ref(database, "userActivities");
    const newRef = push(activitiesRef);
    await set(newRef, {
      ...activity,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to track activity:", error);
  }
}

export async function getRecentActivities(count = 200): Promise<UserActivity[]> {
  const activitiesRef = ref(database, "userActivities");
  const q = query(activitiesRef, orderByChild("timestamp"), limitToLast(count));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  
  const activities: UserActivity[] = [];
  snapshot.forEach((child) => {
    activities.push({ id: child.key!, ...child.val() } as UserActivity);
  });
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

export async function clearAllActivities(): Promise<void> {
  const activitiesRef = ref(database, "userActivities");
  await set(activitiesRef, null);
}
