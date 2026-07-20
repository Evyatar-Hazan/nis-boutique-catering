import { ApiError } from "../http/errors";
import type { ApiPrincipal } from "../http/types";
import {
  findMediaByHash,
  insertMediaAsset,
  type MediaAsset,
} from "./repository";

const sha256Pattern = /^[a-f0-9]{64}$/u;
const positiveIntegerPattern = /^[1-9][0-9]*$/u;

const requireHeader = (request: Request, name: string): string => {
  const value = request.headers.get(name)?.trim();
  if (!value) {
    throw new ApiError(400, "invalid_media_metadata", `${name} is required.`);
  }
  return value;
};

const parseDimension = (request: Request, name: string): number => {
  const value = requireHeader(request, name);
  if (!positiveIntegerPattern.test(value)) {
    throw new ApiError(400, "invalid_media_metadata", `${name} must be a positive integer.`);
  }
  return Number(value);
};

const safeFileName = (fileName: string): string => {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 100);
  return normalized || "upload";
};

export const uploadMediaAsset = async (
  request: Request,
  environment: Pick<Env, "DB" | "MEDIA">,
  principal: ApiPrincipal,
): Promise<MediaAsset> => {
  if (!request.body) {
    throw new ApiError(400, "media_body_required", "Media body is required.");
  }

  const mimeType = requireHeader(request, "Content-Type").toLowerCase();
  const originalFileName = requireHeader(request, "X-File-Name");
  const altText = requireHeader(request, "X-Alt-Text");
  const sha256Hex = requireHeader(request, "X-Content-SHA256").toLowerCase();
  if (!sha256Pattern.test(sha256Hex)) {
    throw new ApiError(400, "invalid_media_metadata", "X-Content-SHA256 must be lowercase hex.");
  }

  const existing = await findMediaByHash(environment.DB, sha256Hex);
  if (existing) {
    throw new ApiError(
      409,
      "duplicate_media",
      "Media with this checksum already exists.",
      [{ message: existing.id, path: "existingMediaId" }],
    );
  }

  const isImage = mimeType.startsWith("image/");
  const width = isImage ? parseDimension(request, "X-Media-Width") : null;
  const height = isImage ? parseDimension(request, "X-Media-Height") : null;
  const sizeBytes = Number(requireHeader(request, "Content-Length"));
  const id = crypto.randomUUID();
  const objectKey = `originals/${id}/${safeFileName(originalFileName)}`;
  let objectWritten = false;

  try {
    await environment.MEDIA.put(objectKey, request.body, {
      httpMetadata: { contentType: mimeType },
      sha256: sha256Hex,
    });
    objectWritten = true;
    return await insertMediaAsset(environment.DB, {
      altText,
      createdBy: principal.adminId,
      height,
      id,
      mimeType,
      objectKey,
      originalFileName,
      sha256Hex,
      sizeBytes,
      width,
    });
  } catch (error: unknown) {
    if (objectWritten) {
      await environment.MEDIA.delete(objectKey).catch(() => undefined);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "media_upload_failed", "Media upload failed integrity checks.");
  }
};
