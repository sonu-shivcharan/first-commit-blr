import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { NextResponse } from "next/server"

import { dynamodb } from "@/lib/aws/dynamodb"
import { initializeDatabase } from "@/lib/aws/init-db"

const TABLE_NAME = "chatbots"

type CreateChatbotRequest = {
  userId?: unknown
  name?: unknown
  description?: unknown
  knowledgeBaseId?: unknown
}

export async function POST(request: Request) {
  await initializeDatabase()

  let body: CreateChatbotRequest

  try {
    body = (await request.json()) as CreateChatbotRequest
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  if (
    typeof body.userId !== "string" ||
    !body.userId.trim() ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.description !== "string" ||
    !body.description.trim()
  ) {
    return NextResponse.json(
      { error: "userId, name, and description are required strings." },
      { status: 400 }
    )
  }

  if (
    body.knowledgeBaseId !== undefined &&
    body.knowledgeBaseId !== null &&
    typeof body.knowledgeBaseId !== "string"
  ) {
    return NextResponse.json(
      { error: "knowledgeBaseId must be a string when provided." },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const chatbot = {
    id: crypto.randomUUID(),
    userId: body.userId.trim(),
    name: body.name.trim(),
    description: body.description.trim(),
    knowledgeBaseId: body.knowledgeBaseId ?? null,
    createdAt: now,
    updatedAt: now,
  }

  try {
    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: chatbot,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )

    return NextResponse.json(chatbot, { status: 201 })
  } catch (error) {
    console.error("Error creating chatbot:", error)
    return NextResponse.json({ error: "Unable to create chatbot." }, { status: 500 })
  }
}