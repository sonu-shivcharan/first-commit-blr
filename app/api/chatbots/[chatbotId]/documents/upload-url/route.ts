import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getOwnedChatbot } from "@/lib/aws/chatbots"
import { s3Client } from "@/lib/aws/s3"

const MAX_FILE_SIZE = 100 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(["pdf", "txt", "csv", "md", "markdown"])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 })
  }

  const { chatbotId } = await params
  const chatbot = await getOwnedChatbot(chatbotId, userId)
  if (!chatbot) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 })
  }

  let body: { filename?: unknown; contentType?: unknown; fileSize?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  if (
    typeof body.filename !== "string" ||
    typeof body.contentType !== "string" ||
    typeof body.fileSize !== "number" ||
    body.fileSize <= 0 ||
    body.fileSize > MAX_FILE_SIZE
  ) {
    return NextResponse.json(
      { error: "filename, contentType, and a valid fileSize are required." },
      { status: 400 }
    )
  }

  const filename = body.filename.replace(/[^a-zA-Z0-9._-]/g, "-")
  const extension = filename.split(".").pop()?.toLowerCase()
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "Only PDF, TXT, CSV, Markdown, and MD files are supported." },
      { status: 400 }
    )
  }

  const key = `chatbots/${chatbot.id}/documents/${crypto.randomUUID()}-${filename}`
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: body.contentType,
    ContentLength: body.fileSize,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })
  return NextResponse.json({ url, key, expiresIn: 300 })
}