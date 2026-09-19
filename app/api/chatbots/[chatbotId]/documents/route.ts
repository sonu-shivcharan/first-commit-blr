import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getOwnedChatbot } from "@/lib/aws/chatbots"
import { s3Client } from "@/lib/aws/s3"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    )
  }

  const { chatbotId } = await params
  const chatbot = await getOwnedChatbot(chatbotId, userId)
  if (!chatbot) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 })
  }

  try {
    const result = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Prefix: `chatbots/${chatbotId}/documents/`,
      })
    )

    return NextResponse.json(
      (result.Contents ?? [])
        .filter((file) => file.Key && !file.Key.endsWith("/"))
        .map((file) => ({
          name: file.Key!.split("/").pop(),
          size: file.Size ?? 0,
          uploadedAt: file.LastModified?.toISOString() ?? null,
        }))
    )
  } catch (error) {
    console.error("Error listing chatbot documents:", error)
    return NextResponse.json(
      { error: "Unable to load uploaded files." },
      { status: 500 }
    )
  }
}
