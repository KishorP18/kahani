import { getAuth, signInAnonymously } from "firebase/auth";
import {
  initializeFirestore, persistentLocalCache, doc, collection, setDoc, getDocs, query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { app } from "./firebase.js";

const auth = getAuth(app);
// Local cache = saves work offline and sync when the connection comes back.
const db = initializeFirestore(app, { localCache: persistentLocalCache() });
const storage = getStorage(app);

// Every visitor gets a stable uid with no sign-up: reuse the saved session, else sign in anonymously.
export const user = auth.authStateReady().then(() => auth.currentUser ?? signInAnonymously(auth).then(c => c.user));

const stories = uid => collection(db, "users", uid, "stories");

export async function saveStory({ id, premise, style, age, scenes }) {
  const { uid } = await user;
  const clean = scenes.map(({ text, choices, source, picked = null, panelPath = null }) => ({ text, choices, source, picked, panelPath }));
  await setDoc(doc(stories(uid), id), { title: premise.slice(0, 80), premise, style, age, scenes: clean, updatedAt: serverTimestamp() }, { merge: true });
}

export async function listStories() {
  const { uid } = await user;
  const snap = await getDocs(query(stories(uid), orderBy("updatedAt", "desc"), limit(20)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Uploads a generated panel (base64) and returns its Storage path. */
export async function savePanel(storyId, n, { mimeType, data }) {
  const { uid } = await user;
  const path = `users/${uid}/panels/${storyId}-${n}.${mimeType.split("/")[1] || "png"}`;
  await uploadString(ref(storage, path), data, "base64", { contentType: mimeType });
  return path;
}

export const panelUrl = path => getDownloadURL(ref(storage, path));
