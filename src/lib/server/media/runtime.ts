import type { MediaStorageDriver } from "$lib/shared/media/config";

const VERCEL_SERVERLESS_ROOT = "/var/task";

export type MediaUploadConfig = {
  driver: MediaStorageDriver;
  supportsDirectUpload: boolean;
};

function getConfiguredMediaStorageDriver() {
  const configuredDriver = process.env.MEDIA_STORAGE_DRIVER?.trim();

  if (
    configuredDriver === "local" ||
    configuredDriver === "vercel-blob"
  ) {
    return configuredDriver;
  }

  return null;
}

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

export function isServerlessBundleFilesystem() {
  return process.cwd().startsWith(VERCEL_SERVERLESS_ROOT);
}

export function getMediaStorageDriver(): MediaStorageDriver {
  const configuredDriver = getConfiguredMediaStorageDriver();

  if (configuredDriver) {
    return configuredDriver;
  }

  return getBlobToken() ? "vercel-blob" : "local";
}

export function getMediaUploadConfig(): MediaUploadConfig {
  const driver = getMediaStorageDriver();

  return {
    driver,
    supportsDirectUpload: driver === "vercel-blob",
  };
}
