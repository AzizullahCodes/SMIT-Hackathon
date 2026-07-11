import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Asset, Issue, HistoryEntry, User } from "./types";

const ASSETS_COLLECTION = "assets";
const ISSUES_COLLECTION = "issues";
const HISTORY_COLLECTION = "history";
const USERS_COLLECTION = "users";

function cleanData(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function generateAssetCode(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const num = String(index).padStart(4, "0");
  return `${prefix}-${num}`;
}

export function generateIssueNumber(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ISS-${datePart}-${random}`;
}

export async function createAsset(
  assetData: Omit<Asset, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(
    collection(db, ASSETS_COLLECTION),
    cleanData({ ...assetData, createdAt: now, updatedAt: now })
  );
  return docRef.id;
}

export async function updateAsset(
  id: string,
  data: Partial<Asset>
): Promise<void> {
  const docRef = doc(db, ASSETS_COLLECTION, id);
  await updateDoc(docRef, cleanData({ ...data, updatedAt: new Date().toISOString() }));
}

export async function getAsset(id: string): Promise<Asset | null> {
  const docRef = doc(db, ASSETS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Asset;
}

export async function getAssets(filters?: {
  status?: string;
  category?: string;
  location?: string;
  search?: string;
}): Promise<Asset[]> {
  let q = query(collection(db, ASSETS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  let assets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Asset));

  if (filters) {
    if (filters.status) {
      assets = assets.filter((a) => a.status === filters.status);
    }
    if (filters.category) {
      assets = assets.filter((a) => a.category === filters.category);
    }
    if (filters.location) {
      assets = assets.filter((a) =>
        a.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          a.code.toLowerCase().includes(s) ||
          a.category.toLowerCase().includes(s)
      );
    }
  }
  return assets;
}

export async function getAssetCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, ASSETS_COLLECTION));
  return snapshot.size;
}

export async function createIssue(
  issueData: Omit<Issue, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(
    collection(db, ISSUES_COLLECTION),
    cleanData({ ...issueData, createdAt: now, updatedAt: now })
  );
  return docRef.id;
}

export async function updateIssue(
  id: string,
  data: Partial<Issue>
): Promise<void> {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  await updateDoc(docRef, cleanData({ ...data, updatedAt: new Date().toISOString() }));
}

export async function getIssue(id: string): Promise<Issue | null> {
  const docRef = doc(db, ISSUES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Issue;
}

export async function getIssues(filters?: {
  status?: string;
  priority?: string;
  assetId?: string;
  assignedToId?: string;
  search?: string;
}): Promise<Issue[]> {
  let q = query(collection(db, ISSUES_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  let issues = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Issue));

  if (filters) {
    if (filters.status) {
      issues = issues.filter((i) => i.status === filters.status);
    }
    if (filters.priority) {
      issues = issues.filter((i) => i.priority === filters.priority);
    }
    if (filters.assetId) {
      issues = issues.filter((i) => i.assetId === filters.assetId);
    }
    if (filters.assignedToId) {
      issues = issues.filter((i) => i.assignedToId === filters.assignedToId);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      issues = issues.filter(
        (i) =>
          i.title.toLowerCase().includes(s) ||
          i.issueNumber.toLowerCase().includes(s) ||
          i.assetName.toLowerCase().includes(s)
      );
    }
  }
  return issues;
}

export async function getIssueCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, ISSUES_COLLECTION));
  return snapshot.size;
}

export async function getIssuesByAsset(assetId: string): Promise<Issue[]> {
  const q = query(
    collection(db, ISSUES_COLLECTION),
    where("assetId", "==", assetId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as Issue))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addHistoryEntry(
  entry: Omit<HistoryEntry, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, HISTORY_COLLECTION), {
    ...entry,
    createdAt: new Date().toISOString(),
  });
}

export async function getAssetHistory(assetId: string): Promise<HistoryEntry[]> {
  const q = query(
    collection(db, HISTORY_COLLECTION),
    where("assetId", "==", assetId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as HistoryEntry))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function uploadFile(
  file: File,
  path: string
): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function getUser(uid: string): Promise<User | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { uid: docSnap.id, ...docSnap.data() } as User;
}

export async function createUser(
  uid: string,
  data: Omit<User, "uid" | "createdAt">
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await setDoc(docRef, {
    uid,
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function getTechnicians(): Promise<User[]> {
  const q = query(
    collection(db, USERS_COLLECTION),
    where("role", "==", "technician")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as User));
}

export async function deleteAsset(id: string): Promise<void> {
  await deleteDoc(doc(db, ASSETS_COLLECTION, id));
}
