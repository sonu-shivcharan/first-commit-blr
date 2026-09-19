import {
  GetIngestionJobCommand,
  StartIngestionJobCommand,
} from "@aws-sdk/client-bedrock-agent"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getOwnedChatbot } from "@/lib/aws/chatbots"
import { bedrockAgent } from "@/lib/aws/bedrock"

export async function GET(
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

  const ingestionJobId = new URL(request.url).searchParams.get("jobId")
  if (!ingestionJobId) {
    return NextResponse.json(
      { error: "An ingestion job ID is required." },
      { status: 400 }
    )
  }

  if (!chatbot.dataSourceId) {
    return NextResponse.json(
      { error: "Chatbot data source is not configured." },
      { status: 400 }
    )
  }

  try {
    const result = await bedrockAgent.send(
      new GetIngestionJobCommand({
        knowledgeBaseId: chatbot.knowledgeBaseId,
        dataSourceId: chatbot.dataSourceId,
        ingestionJobId,
      })
    )

    return NextResponse.json({
      status: result.ingestionJob?.status ?? "UNKNOWN",
    })
  } catch (error) {
    console.error("Error checking document ingestion:", error)
    return NextResponse.json(
      { error: "Unable to check document processing status." },
      { status: 500 }
    )
  }
}

export async function POST(
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

  if (!chatbot.dataSourceId) {
    return NextResponse.json(
      { error: "Chatbot data source is not configured." },
      { status: 400 }
    )
  }

  try {
    const result = await bedrockAgent.send(
      new StartIngestionJobCommand({
        knowledgeBaseId: chatbot.knowledgeBaseId,
        dataSourceId: chatbot.dataSourceId,
        description: `Sync documents for ${chatbot.name}.`,
      })
    )

    return NextResponse.json(
      { ingestionJob: result.ingestionJob },
      { status: 202 }
    )
  } catch (error) {
    console.error("Error starting Bedrock ingestion:", error)
    return NextResponse.json(
      { error: "Unable to start document ingestion." },
      { status: 500 }
    )
  }
}
