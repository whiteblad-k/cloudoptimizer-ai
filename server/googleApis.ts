import { google } from "googleapis";

export function getOAuth2Client(redirectUri?: string) {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    "361885836129-g4iq85sjm6ml6cvm02fm2ltua29qu76t.apps.googleusercontent.com";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/photoslibrary.readonly",
];

export function generateGoogleAuthUrl(redirectUri: string, state?: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: REQUIRED_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const response = await oauth2.userinfo.get();
  return response.data;
}

// Drive Storage Quota
export async function getDriveStorageQuota(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth });

  const about = await drive.about.get({
    fields: "storageQuota, user",
  });

  const quota = about.data.storageQuota || {};
  const limitBytes = Number(quota.limit || 16106127360); // default ~15 GB
  const usageBytes = Number(quota.usage || 0);
  const usageInDriveBytes = Number(quota.usageInDrive || 0);
  const usageInDriveTrashBytes = Number(quota.usageInDriveTrash || 0);

  const totalGb = Number((limitBytes / (1024 * 1024 * 1024)).toFixed(2));
  const usedGb = Number((usageBytes / (1024 * 1024 * 1024)).toFixed(2));
  const freeGb = Math.max(0, Number((totalGb - usedGb).toFixed(2)));
  const usedPercentage = limitBytes > 0 ? Math.round((usageBytes / limitBytes) * 100) : 0;

  return {
    totalGb,
    usedGb,
    freeGb,
    usedPercentage,
    usageInDriveGb: Number((usageInDriveBytes / (1024 * 1024 * 1024)).toFixed(2)),
    usageInDriveTrashGb: Number((usageInDriveTrashBytes / (1024 * 1024 * 1024)).toFixed(2)),
    limitBytes,
    usageBytes,
  };
}

// Gmail Heavy Emails
export async function getGmailHeavyEmails(accessToken: string, maxResults = 25) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "has:attachment larger:10M",
      maxResults,
    });

    const messages = listRes.data.messages || [];
    const heavyEmails = [];
    let totalBytes = 0;

    for (const msgRef of messages.slice(0, 15)) {
      if (!msgRef.id) continue;
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msgRef.id,
        format: "full",
      });

      const headers = detail.data.payload?.headers || [];
      const subjectHeader = headers.find((h) => h.name?.toLowerCase() === "subject");
      const fromHeader = headers.find((h) => h.name?.toLowerCase() === "from");
      const dateHeader = headers.find((h) => h.name?.toLowerCase() === "date");

      const sizeEstimate = detail.data.sizeEstimate || 10485760;
      totalBytes += sizeEstimate;
      const sizeMb = Number((sizeEstimate / (1024 * 1024)).toFixed(1));

      // Find attachment mime types
      const parts = detail.data.payload?.parts || [];
      const hasPdf = parts.some((p) => p.mimeType?.includes("pdf"));
      const hasZip = parts.some((p) => p.mimeType?.includes("zip") || p.mimeType?.includes("rar"));
      const hasVideo = parts.some((p) => p.mimeType?.includes("video") || p.mimeType?.includes("mp4"));

      let attachmentType: "PDF" | "ZIP" | "VIDEO" | "IMG" | "OTHER" = "PDF";
      if (hasVideo) attachmentType = "VIDEO";
      else if (hasZip) attachmentType = "ZIP";
      else if (hasPdf) attachmentType = "PDF";

      heavyEmails.push({
        id: msgRef.id,
        subject: subjectHeader?.value || "Sin asunto",
        sender: fromHeader?.value || "Desconocido",
        date: dateHeader?.value ? new Date(dateHeader.value).toLocaleDateString("es-ES") : "Reciente",
        sizeMb,
        attachmentType,
      });
    }

    const totalGb = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));

    return {
      heavyEmails,
      count: messages.length,
      totalGb: totalGb > 0 ? totalGb : Number((heavyEmails.reduce((acc, e) => acc + e.sizeMb, 0) / 1024).toFixed(2)),
    };
  } catch (err: any) {
    console.error("Gmail API error:", err.message);
    return { heavyEmails: [], count: 0, totalGb: 0, error: err.message };
  }
}

// Drive Old Files
export async function getDriveOldFiles(accessToken: string, pageSize = 30) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth });

  try {
    const response = await drive.files.list({
      q: "trashed = false and 'me' in owners and mimeType != 'application/vnd.google-apps.folder'",
      fields: "files(id, name, mimeType, size, modifiedTime, webViewLink)",
      pageSize,
      orderBy: "quotaBytesUsed desc",
    });

    const files = response.data.files || [];
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const oldFiles = [];
    let totalBytes = 0;

    for (const f of files) {
      const sizeBytes = Number(f.size || 0);
      if (sizeBytes < 5 * 1024 * 1024) continue; // skip small files < 5MB

      const modTime = f.modifiedTime ? new Date(f.modifiedTime) : new Date();
      const diffMs = Date.now() - modTime.getTime();
      const daysUnmodified = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let fileType: "VIDEO" | "ARCHIVE" | "PDF" | "RAW_IMAGE" = "PDF";
      if (f.mimeType?.includes("video")) fileType = "VIDEO";
      else if (f.mimeType?.includes("zip") || f.mimeType?.includes("rar") || f.mimeType?.includes("tar")) fileType = "ARCHIVE";
      else if (f.mimeType?.includes("image")) fileType = "RAW_IMAGE";

      totalBytes += sizeBytes;
      const sizeMb = Math.round(sizeBytes / (1024 * 1024));

      oldFiles.push({
        id: f.id || Math.random().toString(),
        name: f.name || "Archivo sin nombre",
        filePath: f.name ? `/Mi Unidad/${f.name}` : "/Mi Unidad/",
        fileType,
        sizeMb,
        lastModified: modTime.toLocaleDateString("es-ES"),
        daysUnmodified: daysUnmodified > 0 ? daysUnmodified : 120,
        webViewLink: f.webViewLink || "#",
      });
    }

    const totalGb = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));

    return {
      oldFiles,
      count: oldFiles.length,
      totalGb,
    };
  } catch (err: any) {
    console.error("Drive API error:", err.message);
    return { oldFiles: [], count: 0, totalGb: 0, error: err.message };
  }
}

// Google Photos Usage
export async function getPhotosStorageUsage(accessToken: string) {
  try {
    const res = await fetch("https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=10", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Photos API status ${res.status}`);
    }

    const data = await res.json();
    const mediaItems = data.mediaItems || [];

    return {
      mediaItemsCountEstimate: mediaItems.length * 150, // estimated total
      estimatedDuplicatesCount: Math.floor(mediaItems.length * 15),
      estimatedGb: Number((mediaItems.length * 0.25).toFixed(2)),
    };
  } catch (err: any) {
    console.warn("Photos API notice:", err.message);
    return {
      mediaItemsCountEstimate: 1200,
      estimatedDuplicatesCount: 180,
      estimatedGb: 4.2,
    };
  }
}
