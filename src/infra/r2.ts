import { S3Client } from '@aws-sdk/client-s3';

export const r2Client = new S3Client({
  region: 'auto', // Cloudflare R2 specifically uses 'auto' for region
  endpoint: process.env.R2_ENDPOINT as string,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME as string;

// Assuming R2_PUBLIC_URL is defined in .env to expose the CDN URL (e.g., https://cdn.yourdomain.com)
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL as string;