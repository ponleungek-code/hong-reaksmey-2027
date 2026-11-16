import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  getDocFromServer,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RSVPRecord } from '../types';

export const ADMIN_EMAIL = 'ponleungek@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function isPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errObj = error as { code?: string; message?: string };
  return (
    errObj.code === 'permission-denied' ||
    (typeof errObj.message === 'string' &&
      (errObj.message.includes('Missing or insufficient permissions') ||
        errObj.message.includes('PERMISSION_DENIED')))
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with robust auto-detect long polling settings
const databaseId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      experimentalForceLongPolling: false
    },
    databaseId
  );
} catch {
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = dbInstance;

// Validate Connection with graceful fallback
async function testConnection() {
  if (typeof window === 'undefined') return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      handleFirestoreError(error, OperationType.GET, 'test/connection');
    }
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
        console.info('Firestore is operating in resilient offline/caching mode.');
      }
    }
  }
}

// Slightly defer check to allow initial browser socket negotiation
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1200);
}

// Admin Verification Helpers
export const isAdminUser = (user: FirebaseUser | null): boolean => {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL && user.emailVerified === true;
};

export const checkAdminAccess = async (user: FirebaseUser | null): Promise<boolean> => {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
};

// Auth Helpers
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

export const subscribeToAuth = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Message Type & Functions
export interface WeddingMessage {
  id: string;
  userId: string;
  senderName: string;
  senderPhoto?: string;
  message: string;
  photoUrl?: string;
  createdAt?: string;
  timestamp?: Timestamp | null;
}

// Send live message / blessing to the couple
export const sendWeddingMessage = async (data: {
  senderName: string;
  senderPhoto?: string;
  message: string;
  photoUrl?: string;
  userId?: string;
}) => {
  try {
    const currentUserId = (auth.currentUser?.uid || data.userId || 'guest-anon').slice(0, 128);
    const payload: Record<string, unknown> = {
      userId: currentUserId,
      senderName: (data.senderName || 'Anonymous Guest').trim().slice(0, 100),
      message: (data.message || '').trim().slice(0, 3000),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).slice(0, 64),
      timestamp: serverTimestamp()
    };
    const senderPhoto = (data.senderPhoto || auth.currentUser?.photoURL || '').slice(0, 2048);
    if (senderPhoto) payload.senderPhoto = senderPhoto;
    if (data.photoUrl && data.photoUrl.length <= 700000) {
      payload.photoUrl = data.photoUrl;
    }

    const docRef = await addDoc(collection(db, 'messages'), payload);
    return docRef.id;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
    console.warn('sendWeddingMessage fallback (offline queued):', err);
    return `local-${Date.now()}`;
  }
};

// Real-time listener for messages with resilient error handling
export const subscribeToMessages = (callback: (messages: WeddingMessage[]) => void) => {
  try {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const messages: WeddingMessage[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || '',
            senderName: data.senderName || 'Anonymous Guest',
            senderPhoto: data.senderPhoto || '',
            message: data.message || '',
            photoUrl: data.photoUrl || '',
            createdAt: data.createdAt || '',
            timestamp: data.timestamp
          };
        });
        callback(messages);
      },
      (err) => {
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, 'messages');
        }
        console.warn('Real-time messages listener operating in offline mode:', err.message);
      }
    );
  } catch (err) {
    console.warn('Could not start messages listener:', err);
    return () => {};
  }
};

// Real-time RSVP persistence in Firestore
export const saveRSVPToFirestore = async (record: RSVPRecord) => {
  try {
    const currentUserId = (auth.currentUser?.uid || 'guest-anon').slice(0, 128);
    const payload: Record<string, unknown> = {
      id: (record.id || `rsvp-${Date.now()}`).slice(0, 128),
      userId: currentUserId,
      name: (record.name || 'Guest').trim().slice(0, 100),
      phone: (record.phone || '').trim().slice(0, 40),
      guestCount: Math.min(20, Math.max(1, Number(record.guestCount) || 1)),
      attending: record.attending === 'no' ? 'no' : 'yes',
      diet: record.diet || 'none',
      blessing: (record.blessing || '').trim().slice(0, 3000),
      submittedAt: (record.submittedAt || '').slice(0, 64),
      createdAt: new Date().toISOString().slice(0, 64),
      timestamp: serverTimestamp()
    };
    if (record.photoUrl && record.photoUrl.length <= 700000) {
      payload.photoUrl = record.photoUrl;
    }
    await addDoc(collection(db, 'rsvps'), payload);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, 'rsvps');
    }
    console.warn('saveRSVPToFirestore notice (offline queued):', err);
  }
};

export const subscribeToRSVPs = (callback: (records: RSVPRecord[]) => void) => {
  try {
    const q = query(collection(db, 'rsvps'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const records: RSVPRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            phone: data.phone,
            guestCount: data.guestCount,
            attending: data.attending,
            diet: data.diet,
            blessing: data.blessing,
            photoUrl: data.photoUrl,
            submittedAt: data.submittedAt || ''
          };
        });
        callback(records);
      },
      (err) => {
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, 'rsvps');
        }
        console.warn('Real-time RSVPs listener operating in offline mode:', err.message);
      }
    );
  } catch (err) {
    console.warn('Could not start RSVPs listener:', err);
    return () => {};
  }
};

// ==========================================================
// GUEST PHOTOS ALBUM & MEMORIES STORAGE
// ==========================================================
export interface FirestoreGuestPhoto {
  id: string;
  imageUrl: string;
  uploadedBy: string;
  caption?: string;
  likes: number;
  userId?: string;
  createdAt: string;
  timestamp?: Timestamp | null;
}

// Upload guest photo to Firestore storage collection
export const uploadGuestPhotoToFirestore = async (photo: {
  imageUrl: string;
  uploadedBy: string;
  caption?: string;
  userId?: string;
}): Promise<string> => {
  try {
    const currentUserId = (auth.currentUser?.uid || photo.userId || 'guest-anon').slice(0, 128);
    const docRef = await addDoc(collection(db, 'guest_photos'), {
      imageUrl: photo.imageUrl.slice(0, 950000),
      uploadedBy: (photo.uploadedBy || 'ភ្ញៀវកិត្តិយស').trim().slice(0, 120),
      caption: (photo.caption || '').trim().slice(0, 500),
      likes: 1,
      userId: currentUserId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).slice(0, 64),
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.CREATE, 'guest_photos');
    }
    console.warn('uploadGuestPhotoToFirestore notice (stored locally):', err);
    return `local-${Date.now()}`;
  }
};

// Real-time listener for guest photos
export const subscribeToGuestPhotos = (callback: (photos: FirestoreGuestPhoto[]) => void) => {
  try {
    const q = query(collection(db, 'guest_photos'), orderBy('timestamp', 'desc'), limit(80));
    return onSnapshot(
      q,
      (snapshot) => {
        const photos: FirestoreGuestPhoto[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            imageUrl: data.imageUrl,
            uploadedBy: data.uploadedBy || 'ភ្ញៀវកិត្តិយស',
            caption: data.caption || '',
            likes: typeof data.likes === 'number' ? data.likes : 1,
            userId: data.userId || '',
            createdAt: data.createdAt || '',
            timestamp: data.timestamp
          };
        });
        callback(photos);
      },
      (err) => {
        if (isPermissionDeniedError(err)) {
          handleFirestoreError(err, OperationType.LIST, 'guest_photos');
        }
        console.warn('Real-time guest photos listener in offline mode:', err.message);
      }
    );
  } catch (err) {
    console.warn('Could not start guest photos listener:', err);
    return () => {};
  }
};

// Like a guest photo in Firestore
export const likeGuestPhotoInFirestore = async (photoId: string) => {
  try {
    if (photoId.startsWith('local-') || photoId.startsWith('photo-') || photoId.startsWith('prewed-')) return;
    const photoRef = doc(db, 'guest_photos', photoId);
    await updateDoc(photoRef, {
      likes: increment(1)
    });
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, `guest_photos/${photoId}`);
    }
    console.warn('likeGuestPhoto notice:', err);
  }
};

// Admin Delete: permanently delete a guest photo document from Firestore
export const deleteGuestPhotoFromFirestore = async (photoId: string): Promise<void> => {
  if (!photoId || photoId.startsWith('local-') || photoId.startsWith('photo-') || photoId.startsWith('prewed-')) {
    return;
  }
  const path = `guest_photos/${photoId}`;
  try {
    await deleteDoc(doc(db, 'guest_photos', photoId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export type { FirebaseUser };
