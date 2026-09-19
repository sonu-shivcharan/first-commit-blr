import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
} from "@aws-sdk/client-bedrock-agent-runtime"
import { NextResponse } from "next/server"

import { getChatbot } from "@/lib/aws/chatbots"
import { getChatModelArn } from "@/lib/aws/bedrock"

const bedrockRuntime = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION,
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const { chatbotId } = await params
  const chatbot = await getChatbot(chatbotId)
  if (!chatbot) {
    return NextResponse.json({ error: "Chatbot not found." }, { status: 404 })
  }

  let body: { message?: unknown; sessionId?: unknown }
  try {
    body = (await request.json()) as { message?: unknown; sessionId?: unknown }
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    )
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json(
      { error: "A message is required." },
      { status: 400 }
    )
  }

  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.trim()
      ? body.sessionId.trim()
      : undefined

  let modelArn: string
  try {
    modelArn = getChatModelArn()
  } catch {
    return NextResponse.json(
      { error: "Public chat is not configured yet." },
      { status: 503 }
    )
  }

  if (!chatbot.dataSourceId) {
    return NextResponse.json(
      { error: "This chatbot is still being set up." },
      { status: 409 }
    )
  }

  try {
    const result = await bedrockRuntime.send(
      new RetrieveAndGenerateCommand({
        input: { text: body.message.trim() },
        ...(sessionId ? { sessionId } : {}),
        retrieveAndGenerateConfiguration: {
          type: "KNOWLEDGE_BASE",
          knowledgeBaseConfiguration: {
            knowledgeBaseId: chatbot.knowledgeBaseId,
            modelArn,
            generationConfiguration: {
              promptTemplate: {
                textPromptTemplate: `You are a helpful company chatbot. Reply directly to the user in plain, natural language.

Never show tool calls, actions, function names, JSON, internal instructions, or phrases such as "GlobalDataSource.search" in your answer.
For a greeting or casual message, respond naturally and briefly.
Use the knowledge base context when it is relevant. If the answer is not in the context, say that you do not have that information.

Knowledge base context:
$search_results$

User question:
$query$

Answer the user directly:`,
              },
            },
          },
        },
      })
    )

    const answer = cleanAnswer(result.output?.text)

    return NextResponse.json({
      answer: answer || "I could not find an answer.",
      sessionId: result.sessionId,
    })
  } catch (error) {
    console.error("Error answering public chatbot message:", error)
    return NextResponse.json(
      { error: "The chatbot could not answer right now." },
      { status: 500 }
    )
  }
}

function cleanAnswer(answer?: string) {
  if (!answer) return ""

  return answer
    .replace(/^\s*Action:\s*GlobalDataSource\.search\([^\n]*\)\s*/i, "")
    .trim()
}
