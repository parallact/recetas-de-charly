import { S3Client } from '@aws-sdk/client-s3'

// R2 client singleton
let r2Client: S3Client | null = null

export function getR2Client(): S3Client | null {
  const missing: string[] = []
  if (!process.env.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID')
  if (!process.env.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID')
  if (!process.env.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY')

  if (missing.length > 0) {
    console.error(`[R2] Missing environment variables: ${missing.join(', ')}`)
    return null
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }

  return r2Client
}

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'recetas-de-charly'
