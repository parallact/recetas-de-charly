import { S3Client } from '@aws-sdk/client-s3'

// R2 client singleton
let r2Client: S3Client | null = null

export function getR2Client(): S3Client | null {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn('[R2] Missing environment variables')
    return null
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  }

  return r2Client
}

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'recetas-de-charly'
