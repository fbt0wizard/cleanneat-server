import fs from 'node:fs';
import path from 'node:path';
import type { UseCaseDependencies } from '@infrastructure/di';
import { fileTypeFromBuffer } from 'file-type/core';
import { nanoid } from 'nanoid';

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

const ALLOWED_MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export type UploadFileParams = { buffer: Uint8Array; originalFilename?: string };
export type UploadFileResult =
  | { type: 'success'; filename: string }
  | { type: 'invalid_file_type'; message: string }
  | { type: 'file_too_large'; message: string }
  | { type: 'error' };

/**
 * Validates file by magic bytes (not extension), ensures it's an allowed PDF or image,
 * stores it with a safe unique name, and returns the filename for URL building.
 */
export async function uploadFile(params: UploadFileParams, deps: UseCaseDependencies): Promise<UploadFileResult> {
  const { logger, config } = deps;
  const { buffer } = params;

  if (buffer.length > MAX_SIZE_BYTES) {
    return { type: 'file_too_large', message: 'File must not exceed 20MB' };
  }

  if (buffer.length === 0) {
    return { type: 'invalid_file_type', message: 'File is empty' };
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    logger.warn(
      { bytes: buffer.length },
      'Upload rejected: could not detect file type (possible malware or invalid file)',
    );
    return { type: 'invalid_file_type', message: 'File type could not be determined or is not allowed' };
  }

  if (!ALLOWED_MIMES.has(detected.mime)) {
    logger.warn({ mime: detected.mime, ext: detected.ext }, 'Upload rejected: disallowed file type');
    return { type: 'invalid_file_type', message: 'Only PDF and image files (JPEG, PNG, GIF, WebP) are allowed' };
  }

  const uploadDir = path.join(process.cwd(), config.uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });

  const filename = `${nanoid()}.${detected.ext}`;
  const filePath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(filePath, buffer);
    logger.info({ filename, mime: detected.mime, size: buffer.length }, 'File uploaded');
    return { type: 'success', filename };
  } catch (error) {
    logger.error({ error, filename }, 'Failed to write upload');
    return { type: 'error' };
  }
}
