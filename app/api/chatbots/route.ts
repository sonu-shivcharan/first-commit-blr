import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { dynamodb } from "@/lib/aws/dynamodb"
import { createKnowledgeBase } from "@/lib/aws/bedrock"
import { initializeDatabase } from "@/lib/aws/init-db"

const TABLE_NAME = "chatbots"

type CreateChatbotRequest = {
  name?: unknown
  description?: unknown
}

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    )
  }

  try {
    await initializeDatabase()

    const chatbots = []
    let lastEvaluatedKey: Record<string, unknown> | undefined

    do {
      const result = await dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: { ":userId": userId },
          ExclusiveStartKey: lastEvaluatedKey,
        })
      )

      chatbots.push(...(result.Items ?? []))
      lastEvaluatedKey = result.LastEvaluatedKey
    } while (lastEvaluatedKey)

    chatbots.sort((first, second) =>
      String(second.createdAt ?? "").localeCompare(
        String(first.createdAt ?? "")
      )
    )

    return NextResponse.json(chatbots)
  } catch (error) {
    console.error("Error listing chatbots:", error)
    return NextResponse.json(
      { error: "Unable to load chatbots." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    )
  }

  await initializeDatabase()

  let body: CreateChatbotRequest

  try {
    body = (await request.json()) as CreateChatbotRequest
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    )
  }

  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.description !== "string" ||
    !body.description.trim()
  ) {
    return NextResponse.json(
      { error: "name and description are required strings." },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const chatbotId = crypto.randomUUID()

  try {
    const { knowledgeBaseId } = await createKnowledgeBase({
      chatbotId,
      description: body.description.trim(),
    })
    const chatbot = {
      id: chatbotId,
      userId,
      name: body.name.trim(),
      description: body.description.trim(),
      knowledgeBaseId,
      dataSourceId: null,
      provisioningStatus: "CREATING",
      createdAt: now,
      updatedAt: now,
    }

    await dynamodb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: chatbot,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )

    return NextResponse.json(chatbot, { status: 202 })
  } catch (error) {
    console.error("Error creating chatbot:", error)
    return NextResponse.json(
      { error: "Unable to create chatbot." },
      { status: 500 }
    )
  }
}
