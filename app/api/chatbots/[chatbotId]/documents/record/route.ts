import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getOwnedChatbot } from "@/lib/aws/chatbots"
import { dynamodb } from "@/lib/aws/dynamodb"
import { initializeDatabase } from "@/lib/aws/init-db"

type RecordDocumentRequest = {
  key?: unknown
  filename?: unknown
  fileSize?: unknown
}

export async function POST(
  request: Request,
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

  let body: RecordDocumentRequest
  try {
    body = (await request.json()) as RecordDocumentRequest
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    )
  }

  if (
    typeof body.key !== "string" ||
    !body.key.startsWith(`chatbots/${chatbotId}/documents/`) ||
    typeof body.filename !== "string" ||
    typeof body.fileSize !== "number"
  ) {
    return NextResponse.json(
      { error: "A valid key, filename, and fileSize are required." },
      { status: 400 }
    )
  }

  try {
    await initializeDatabase()
    const now = new Date().toISOString()
    const datasource = {
      id: crypto.randomUUID(),
      chatbotId,
      dataSourceId: chatbot.dataSourceId,
      s3Key: body.key,
      s3Uri: `s3://${process.env.AWS_S3_BUCKET_NAME}/${body.key}`,
      filename: body.filename,
      fileSize: body.fileSize,
      createdAt: now,
      updatedAt: now,
    }

    await dynamodb.send(
      new PutCommand({
        TableName: "datasources",
        Item: datasource,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )

    return NextResponse.json(datasource, { status: 201 })
  } catch (error) {
    console.error("Error recording chatbot datasource:", error)
    return NextResponse.json(
      { error: "Unable to record the uploaded datasource." },
      { status: 500 }
    )
  }
}
