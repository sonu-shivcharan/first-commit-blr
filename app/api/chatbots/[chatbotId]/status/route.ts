import { UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getOwnedChatbot } from "@/lib/aws/chatbots"
import {
  createDataSource,
  getKnowledgeBaseStatus,
} from "@/lib/aws/bedrock"
import { dynamodb } from "@/lib/aws/dynamodb"

export async function GET(
  _request: Request,
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

  try {
    const knowledgeBaseStatus = await getKnowledgeBaseStatus(chatbot.knowledgeBaseId)

    if (knowledgeBaseStatus === "ACTIVE" && !chatbot.dataSourceId) {
      const { dataSourceId } = await createDataSource({
        chatbotId: chatbot.id,
        knowledgeBaseId: chatbot.knowledgeBaseId,
        name: chatbot.name,
      })

      await dynamodb.send(
        new UpdateCommand({
          TableName: "chatbots",
          Key: { id: chatbot.id },
          UpdateExpression:
            "SET dataSourceId = :dataSourceId, provisioningStatus = :status, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":dataSourceId": dataSourceId,
            ":status": "READY",
            ":updatedAt": new Date().toISOString(),
          },
        })
      )

      return NextResponse.json({
        status: "READY",
        knowledgeBaseStatus,
        dataSourceId,
      })
    }

    const status = knowledgeBaseStatus === "FAILED" ? "FAILED" : knowledgeBaseStatus
    await dynamodb.send(
      new UpdateCommand({
        TableName: "chatbots",
        Key: { id: chatbot.id },
        UpdateExpression: "SET provisioningStatus = :status, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":status": status,
          ":updatedAt": new Date().toISOString(),
        },
      })
    )

    return NextResponse.json({
      status: chatbot.dataSourceId ? "READY" : status,
      knowledgeBaseStatus,
      dataSourceId: chatbot.dataSourceId,
    })
  } catch (error) {
    console.error("Error checking chatbot provisioning status:", error)
    return NextResponse.json(
      { error: "Unable to check chatbot provisioning status." },
      { status: 500 }
    )
  }
}