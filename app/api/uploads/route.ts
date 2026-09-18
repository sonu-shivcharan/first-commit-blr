import { NextResponse } from "next/server"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { s3Client } from "@/lib/aws/s3"
import { PutObjectCommand } from "@aws-sdk/client-s3"

// Enforce a strict max size limits (e.g., 100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const { filename, contentType, fileSize } = await request.json()

    // 1. Validate file size on the server side
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit." },
        { status: 400 }
      )
    }

    // 2. Generate a secure, unique key to prevent overwriting existing files
    const uniqueKey = `uploads/${Date.now()}-${filename}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    })

    // 3. Generate URL expiring in 60 seconds for tight security
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    })

    return NextResponse.json({ url: presignedUrl, key: uniqueKey })
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
