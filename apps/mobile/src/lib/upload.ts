import { api } from './api';

interface SignedUrlResponse {
  data: {
    uploadUrl: string;
    fileUrl: string;
    key: string;
  };
}

/**
 * Upload a single image to S3 using signed URL
 * @param uri - Local file URI from image picker
 * @param folder - S3 folder (e.g., 'posts', 'avatars')
 * @returns Final public URL of the uploaded file
 */
export async function uploadImage(
  uri: string,
  folder: string = 'posts'
): Promise<string> {
  // 1. Get file info from URI
  const filename = uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const extension = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = getMimeType(extension);

  // 2. Get signed URL from API
  const response = await api.post<SignedUrlResponse>('/upload/signed-url', {
    fileType: mimeType,
    folder,
  });

  const { uploadUrl, fileUrl } = response.data.data;

  // 3. Read file and upload to S3
  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': mimeType,
    },
  });

  return fileUrl;
}

/**
 * Upload multiple images in parallel
 * @param uris - Array of local file URIs
 * @param folder - S3 folder
 * @param onProgress - Optional callback for progress updates
 * @returns Array of public URLs
 */
export async function uploadMultipleImages(
  uris: string[],
  folder: string = 'posts',
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const total = uris.length;
  let completed = 0;
  const urls: string[] = [];

  // Upload images in parallel with progress tracking
  const uploadPromises = uris.map(async (uri) => {
    const url = await uploadImage(uri, folder);
    completed++;
    onProgress?.(completed, total);
    return url;
  });

  const results = await Promise.all(uploadPromises);
  return results;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  return mimeTypes[extension] || 'image/jpeg';
}

/**
 * Validate image file before upload
 */
export function validateImage(uri: string, maxSizeMB: number = 10): boolean {
  // Basic validation - in production, you might want to check actual file size
  const filename = uri.split('/').pop() || '';
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];

  return validExtensions.includes(extension);
}
