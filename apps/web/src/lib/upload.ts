import { api } from './api';

interface SignedUrlResponse {
  data: {
    uploadUrl: string;
    fileUrl: string;
    key: string;
  };
}

/**
 * Upload a single file to S3 using signed URL
 * @param file - File object from input
 * @param folder - S3 folder (e.g., 'posts', 'avatars')
 * @returns Final public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  folder: string = 'posts'
): Promise<string> {
  // 1. Get signed URL from API
  const response = await api.post<SignedUrlResponse>('/upload/signed-url', {
    fileType: file.type,
    folder,
  });

  const { uploadUrl, fileUrl } = response.data;

  // 2. Upload file directly to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  return fileUrl;
}

/**
 * Upload multiple files in parallel
 * @param files - Array of File objects
 * @param folder - S3 folder
 * @param onProgress - Optional callback for progress updates
 * @returns Array of public URLs
 */
export async function uploadMultipleFiles(
  files: File[],
  folder: string = 'posts',
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const total = files.length;
  let completed = 0;

  const uploadPromises = files.map(async (file) => {
    const url = await uploadFile(file, folder);
    completed++;
    onProgress?.(completed, total);
    return url;
  });

  return Promise.all(uploadPromises);
}

/**
 * Convert a File to a data URL for preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Create a file input and trigger file selection
 */
export function selectFiles(options: {
  multiple?: boolean;
  accept?: string;
}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options.multiple ?? false;
    input.accept = options.accept ?? 'image/*';

    input.onchange = () => {
      const files = Array.from(input.files || []);
      resolve(files);
    };

    input.click();
  });
}
