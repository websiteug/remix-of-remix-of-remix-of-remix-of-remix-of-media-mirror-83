import { database, db } from "./firebase";
import { ref, push, set, get, update, remove } from "firebase/database";
import { collection, getDocs, doc, updateDoc, deleteDoc, Timestamp, getDoc, setDoc, query, orderBy, limit, where } from "firebase/firestore";
import type { Movie, Series, Episode, Advert, HeroImage, App } from "./firebase-db";

export interface Transaction {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  planName: string;
  amount: number;
  orderId: string;
  orderTrackingId: string;
  status: "success" | "failed" | "pending";
  confirmationCode?: string;
  failedReason?: string;
  createdAt: Date;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  avatar?: string;
  subscription?: {
    plan: string;
    expiresAt: Date;
    isActive: boolean;
  };
  createdAt?: Date;
  lastActive?: Date;
  watchTime?: number;
}

// ============== MOVIES ==============
export async function createMovie(movie: Omit<Movie, "id">): Promise<string> {
  const moviesRef = ref(database, "movies");
  const newMovieRef = push(moviesRef);
  await set(newMovieRef, { ...movie, createdAt: Date.now() });
  return newMovieRef.key || "";
}

export async function updateMovie(id: string, movie: Partial<Movie>): Promise<void> {
  const movieRef = ref(database, `movies/${id}`);
  await update(movieRef, movie);
}

export async function deleteMovie(id: string): Promise<void> {
  const movieRef = ref(database, `movies/${id}`);
  await remove(movieRef);
}

// ============== SERIES ==============
export async function createSeries(series: Omit<Series, "id">): Promise<string> {
  const seriesRef = ref(database, "series");
  const newSeriesRef = push(seriesRef);
  await set(newSeriesRef, { ...series, createdAt: Date.now() });
  return newSeriesRef.key || "";
}

export async function updateSeries(id: string, series: Partial<Series>): Promise<void> {
  const seriesRef = ref(database, `series/${id}`);
  await update(seriesRef, series);
}

export async function deleteSeries(id: string): Promise<void> {
  const seriesRef = ref(database, `series/${id}`);
  await remove(seriesRef);
}

// ============== EPISODES ==============
export async function createEpisode(episode: Omit<Episode, "id">): Promise<string> {
  const episodesRef = ref(database, "episodes");
  const newEpisodeRef = push(episodesRef);
  await set(newEpisodeRef, { ...episode, createdAt: Date.now() });
  return newEpisodeRef.key || "";
}

export async function updateEpisode(id: string, episode: Partial<Episode>): Promise<void> {
  const episodeRef = ref(database, `episodes/${id}`);
  await update(episodeRef, episode);
}

export async function deleteEpisode(id: string): Promise<void> {
  const episodeRef = ref(database, `episodes/${id}`);
  await remove(episodeRef);
}

export async function getAllEpisodes(): Promise<Episode[]> {
  const episodesRef = ref(database, "episodes");
  const snapshot = await get(episodesRef);
  if (snapshot.exists()) {
    const episodes: Episode[] = [];
    snapshot.forEach((child) => {
      episodes.push({ id: child.key, ...child.val() } as Episode);
    });
    return episodes;
  }
  return [];
}

// ============== ADVERTS/GUIDE ==============
export async function createAdvert(advert: Omit<Advert, "id">): Promise<string> {
  const advertsRef = ref(database, "adverts");
  const newAdvertRef = push(advertsRef);
  await set(newAdvertRef, { ...advert, createdAt: Date.now() });
  return newAdvertRef.key || "";
}

export async function updateAdvert(id: string, advert: Partial<Advert>): Promise<void> {
  const advertRef = ref(database, `adverts/${id}`);
  await update(advertRef, advert);
}

export async function deleteAdvert(id: string): Promise<void> {
  const advertRef = ref(database, `adverts/${id}`);
  await remove(advertRef);
}

// ============== HERO IMAGES ==============
export async function createHeroImage(heroImage: Omit<HeroImage, "id">): Promise<string> {
  const heroImagesRef = ref(database, "heroImages");
  const newHeroImageRef = push(heroImagesRef);
  await set(newHeroImageRef, { ...heroImage, createdAt: Date.now() });
  return newHeroImageRef.key || "";
}

export async function updateHeroImage(id: string, heroImage: Partial<HeroImage>): Promise<void> {
  const heroImageRef = ref(database, `heroImages/${id}`);
  await update(heroImageRef, heroImage);
}

export async function deleteHeroImage(id: string): Promise<void> {
  const heroImageRef = ref(database, `heroImages/${id}`);
  await remove(heroImageRef);
}

// ============== APPS ==============
export async function createApp(app: Omit<App, "id">): Promise<string> {
  const appsRef = ref(database, "apps");
  const newAppRef = push(appsRef);
  await set(newAppRef, { ...app, createdAt: Date.now() });
  return newAppRef.key || "";
}

export async function updateApp(id: string, app: Partial<App>): Promise<void> {
  const appRef = ref(database, `apps/${id}`);
  await update(appRef, app);
}

export async function deleteApp(id: string): Promise<void> {
  const appRef = ref(database, `apps/${id}`);
  await remove(appRef);
}

// ============== USERS ==============
export async function getAllUsers(): Promise<UserData[]> {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  const users: UserData[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      id: doc.id,
      name: data.name || "Unknown",
      email: data.email || "",
      isAdmin: data.isAdmin || false,
      avatar: data.avatar,
      subscription: data.subscription ? {
        plan: data.subscription.plan,
        expiresAt: data.subscription.expiresAt?.toDate ? data.subscription.expiresAt.toDate() : new Date(data.subscription.expiresAt),
        isActive: data.subscription.isActive,
      } : undefined,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
    });
  });
  return users;
}

export async function updateUserSubscription(
  userId: string, 
  plan: string, 
  days: number
): Promise<void> {
  console.log("[Admin] Activating subscription:", { userId, plan, days });
  
  const userRef = doc(db, "users", userId);
  const now = new Date();
  const expiresAt = new Date();
  
  if (days === -1) {
    // Lifetime
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);
  } else {
    expiresAt.setDate(expiresAt.getDate() + days);
  }
  
  console.log("[Admin] Subscription will expire at:", expiresAt.toISOString());
  
  const subscriptionData = {
    plan,
    expiresAt: Timestamp.fromDate(expiresAt),
    isActive: true,
    activatedAt: Timestamp.fromDate(now),
    activatedBy: "admin",
  };
  
  // Use setDoc with merge to handle both existing and new documents
  await setDoc(userRef, {
    subscription: subscriptionData
  }, { merge: true });
  
  console.log("[Admin] Subscription saved to users collection for:", userId);
  
  // Also create in subscriptions collection for consistency
  const subscriptionDocRef = doc(db, "subscriptions", `${userId}_admin_${now.getTime()}`);
  await setDoc(subscriptionDocRef, {
    ...subscriptionData,
    userId,
    orderId: `admin_${now.getTime()}`,
    createdAt: Timestamp.fromDate(now),
  });
  
  console.log("[Admin] Subscription also saved to subscriptions collection");
}

export async function removeUserSubscription(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  // Clear subscription completely so the app doesn't treat an incomplete object as an active plan
  await setDoc(
    userRef,
    {
      subscription: null,
    },
    { merge: true }
  );

  // Also deactivate all entries in the subscriptions collection so the fallback check doesn't re-grant access
  const subscriptionsRef = collection(db, "subscriptions");
  const q = query(subscriptionsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const deactivatePromises: Promise<void>[] = [];
  snapshot.forEach((docSnap) => {
    deactivatePromises.push(
      updateDoc(doc(db, "subscriptions", docSnap.id), { isActive: false })
    );
  });
  await Promise.all(deactivatePromises);
}

export async function deleteUser(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);
}

// ============== ADMIN PASSWORD ==============
export async function updateAdminPassword(newPassword: string): Promise<void> {
  const adminConfigRef = doc(db, "config", "admin");
  await setDoc(adminConfigRef, { 
    password: newPassword,
    updatedAt: new Date() 
  }, { merge: true });
}

// ============== STATS ==============
export async function getAdminStats(): Promise<{
  totalMovies: number;
  totalSeries: number;
  totalEpisodes: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalAdverts: number;
  totalHeroImages: number;
  totalApps: number;
}> {
  const [movies, series, episodes, users, adverts, heroImages, apps] = await Promise.all([
    get(ref(database, "movies")),
    get(ref(database, "series")),
    get(ref(database, "episodes")),
    getAllUsers(),
    get(ref(database, "adverts")),
    get(ref(database, "heroImages")),
    get(ref(database, "apps")),
  ]);

  const activeSubscriptions = users.filter(user => 
    user.subscription?.isActive && 
    user.subscription.expiresAt && 
    new Date(user.subscription.expiresAt) > new Date()
  ).length;

  return {
    totalMovies: movies.exists() ? Object.keys(movies.val()).length : 0,
    totalSeries: series.exists() ? Object.keys(series.val()).length : 0,
    totalEpisodes: episodes.exists() ? Object.keys(episodes.val()).length : 0,
    totalUsers: users.length,
    activeSubscriptions,
    totalAdverts: adverts.exists() ? Object.keys(adverts.val()).length : 0,
    totalHeroImages: heroImages.exists() ? Object.keys(heroImages.val()).length : 0,
    totalApps: apps.exists() ? Object.keys(apps.val()).length : 0,
  };
}

// ============== TRANSACTIONS ==============
export async function saveTransaction(transaction: Omit<Transaction, "id">): Promise<string> {
  const transactionsRef = collection(db, "transactions");
  const docRef = doc(transactionsRef);
  await setDoc(docRef, {
    ...transaction,
    createdAt: Timestamp.fromDate(transaction.createdAt),
  });
  return docRef.id;
}

export async function deleteTransaction(id: string): Promise<void> {
  const transactionRef = doc(db, "transactions", id);
  await deleteDoc(transactionRef);
}

export async function getTransactions(): Promise<Transaction[]> {
  const transactionsRef = collection(db, "transactions");
  const snapshot = await getDocs(transactionsRef);
  const transactions: Transaction[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    transactions.push({
      id: docSnap.id,
      userId: data.userId || "",
      userName: data.userName || "Unknown",
      userEmail: data.userEmail || "",
      phoneNumber: data.phoneNumber || "",
      planName: data.planName || "",
      amount: data.amount || 0,
      orderId: data.orderId || "",
      orderTrackingId: data.orderTrackingId || "",
      status: data.status || "pending",
      confirmationCode: data.confirmationCode,
      failedReason: data.failedReason || "",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    });
  });
  // Sort newest first
  transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return transactions;
}