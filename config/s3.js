import 'dotenv/config';    
import { S3Client } from '@aws-sdk/client-s3';

const { AWS_REGION, S3_BUCKET, S3_PUBLIC_BASE } = process.env;

export const s3 = new S3Client({ region: AWS_REGION });
export const bucketName = S3_BUCKET;
export const publicBase = (S3_PUBLIC_BASE || '').replace(/\/$/, '');
