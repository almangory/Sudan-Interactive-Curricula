import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add full drive scope requested by the user
provider.addScope("https://www.googleapis.com/auth/drive");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we have a user but no token cached (e.g., refresh),
        // we might need to re-authenticate or if we have it we use it.
        // We'll require user interaction for popup to guarantee the access token.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Auth");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// --- Google Drive API helpers ---

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  size?: string;
}

/**
 * Lists files inside the "المناهج السودانية 🇸🇩" folder or general files from Google Drive
 */
export const listDriveFiles = async (accessToken: string, q?: string): Promise<DriveFile[]> => {
  const queryParam = q ? encodeURIComponent(q) : encodeURIComponent("trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime,size)&q=${queryParam}&orderBy=createdTime%20desc`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Failed to list files from Google Drive");
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Creates folders in Google Drive. Checks if folder exists inside parent.
 */
export const createFolder = async (accessToken: string, folderName: string, parentId?: string): Promise<string> => {
  // First check if folder already exists of that name to prevent duplicates
  let q = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }
  
  const existingFiles = await listDriveFiles(accessToken, q);
  if (existingFiles.length > 0) {
    return existingFiles[0].id;
  }

  // Create new folder
  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Failed to create folder in Google Drive");
  }

  const folder = await response.json();
  return folder.id;
};

/**
 * Uploads a file (Blob or File) to Google Drive in metadata-and-media multipart upload format
 */
export const uploadFileToDrive = async (
  accessToken: string,
  fileName: string,
  mimeType: string,
  fileBlob: Blob,
  parentId?: string
): Promise<DriveFile> => {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: parentId ? [parentId] : undefined,
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  formData.append("file", fileBlob);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,iconLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "Failed to upload file to Google Drive");
  }

  return await response.json();
};

/**
 * Helper to download PDF from app's proxy endpoint and save directly to Google Drive
 */
export const saveUrlToGoogleDrive = async (
  accessToken: string,
  fileUrl: string,
  fileName: string,
  folderId?: string
): Promise<DriveFile> => {
  // Fetch PDF as Blob. We use local Express proxy to bypass CORS
  const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(fileUrl)}`;
  const fileRes = await fetch(proxyUrl);
  if (!fileRes.ok) {
    throw new Error("Failed to download PDF from server proxy. Please verify the URL.");
  }

  const blob = await fileRes.blob();
  const fileToUpload = blob.slice(0, blob.size, "application/pdf");

  return await uploadFileToDrive(accessToken, fileName, "application/pdf", fileToUpload, folderId);
};
