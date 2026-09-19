import { ScanCommand } from "@aws-sdk/lib-dynamodb"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getOwnedChatbot } from "@/lib/aws/chatbots"
import { dynamodb } from "@/lib/aws/dynamodb"
import { initializeDatabase } from "@/lib/aws/init-db"

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
    await initializeDatabase()
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: "datasources",
        FilterExpression: "chatbotId = :chatbotId",
        ExpressionAttributeValues: { ":chatbotId": chatbotId },
      })
    )

    return NextResponse.json(
      (result.Items ?? [])
        .sort((first, second) =>
          String(second.createdAt ?? "").localeCompare(
            String(first.createdAt ?? "")
          )
        )
        .map((file) => ({
          id: file.id,
          name: file.filename,
          size: file.fileSize,
          s3Key: file.s3Key,
          s3Uri: file.s3Uri,
          dataSourceId: file.dataSourceId,
          uploadedAt: file.createdAt,
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
