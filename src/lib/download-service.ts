import { database } from "./firebase";
import { ref, push, set, get, query, orderByChild, equalTo } from "firebase/database";

const GOOGLE_DRIVE_API_KEY = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";

export interface DownloadLink {
  id?: string;
  contentId: string;
  contentTitle: string;
  fileId: string;
  token: string;
  userId?: string;
  used: boolean;
  usedAt?: number;
  createdAt: number;
  expiresAt: number;
}

// Generate a unique token for one-time download
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Extract Google Drive file ID from URL
export function getFileIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  
  const drivePatterns = [
    /https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /https?:\/\/docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of drivePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Check if URL is a direct video URL (not Google Drive)
export function isDirectVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !url.includes('drive.google.com') && !url.includes('docs.google.com');
}

// Create a one-time download link
export async function createDownloadLink(
  contentId: string,
  contentTitle: string,
  videoUrl: string,
  userId?: string
): Promise<{ downloadUrl: string; filename: string } | null> {
  // For direct video URLs, return the URL directly
  if (isDirectVideoUrl(videoUrl)) {
    return {
      downloadUrl: videoUrl,
      filename: `${contentTitle}.mp4`,
    };
  }

  const fileId = getFileIdFromUrl(videoUrl);
  if (!fileId) return null;

  const token = generateToken();
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours expiration

  const downloadLink: DownloadLink = {
    contentId,
    contentTitle,
    fileId,
    token,
    userId,
    used: false,
    createdAt: now,
    expiresAt,
  };

  // Save to Firebase
  const linksRef = ref(database, "downloadLinks");
  const newLinkRef = push(linksRef);
  await set(newLinkRef, downloadLink);

  // Return the proxied download URL with the token
  const filename = sanitizeFilename(`${contentTitle}.mp4`);
  const downloadUrl = `${window.location.origin}/api/download?token=${token}&filename=${encodeURIComponent(filename)}`;

  return {
    downloadUrl,
    filename,
  };
}

// Validate and use a download link
export async function validateAndUseDownloadLink(token: string): Promise<{
  valid: boolean;
  fileId?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const linksRef = ref(database, "downloadLinks");
    const linkQuery = query(linksRef, orderByChild("token"), equalTo(token));
    const snapshot = await get(linkQuery);

    if (!snapshot.exists()) {
      return { valid: false, error: "Invalid download link" };
    }

    let linkData: DownloadLink | null = null;
    let linkKey: string | null = null;
    
    snapshot.forEach((child) => {
      linkData = child.val() as DownloadLink;
      linkKey = child.key;
    });

    if (!linkData || !linkKey) {
      return { valid: false, error: "Invalid download link" };
    }

    // Check if already used
    if (linkData.used) {
      return { 
        valid: false, 
        error: "This download link has already been used. Subscribe to www.luoancientmovies.com for unlimited downloads." 
      };
    }

    // Check if expired
    if (Date.now() > linkData.expiresAt) {
      return { 
        valid: false, 
        error: "This download link has expired. Please generate a new one." 
      };
    }

    // Mark as used
    const linkRef = ref(database, `downloadLinks/${linkKey}`);
    await set(linkRef, {
      ...linkData,
      used: true,
      usedAt: Date.now(),
    });

    const filename = sanitizeFilename(`${linkData.contentTitle}.mp4`);
    
    return {
      valid: true,
      fileId: linkData.fileId,
      filename,
    };
  } catch (error) {
    console.error("Error validating download link:", error);
    return { valid: false, error: "Failed to validate download link" };
  }
}

// Get the actual download URL - use Google's direct download with confirm to bypass virus scan for large files
export function getGoogleDriveDownloadUrl(fileId: string, fileName?: string): string {
  // This URL format bypasses the virus scan confirmation page for large files
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

// Sanitize filename for download
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

// Check if user has an active download link for content
export async function hasActiveDownloadLink(contentId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const linksRef = ref(database, "downloadLinks");
    const linkQuery = query(linksRef, orderByChild("contentId"), equalTo(contentId));
    const snapshot = await get(linkQuery);

    if (!snapshot.exists()) return false;

    let hasActive = false;
    snapshot.forEach((child) => {
      const link = child.val() as DownloadLink;
      if (link.userId === userId && !link.used && Date.now() < link.expiresAt) {
        hasActive = true;
      }
    });

    return hasActive;
  } catch (error) {
    console.error("Error checking active download link:", error);
    return false;
  }
}
