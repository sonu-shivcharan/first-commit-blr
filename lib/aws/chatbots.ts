import { GetCommand } from "@aws-sdk/lib-dynamodb"

import { dynamodb } from "@/lib/aws/dynamodb"

export type ChatbotRecord = {
  id: string
  userId: string
  name: string
  description: string
  knowledgeBaseId: string
  dataSourceId: string | null
  provisioningStatus?: string
}

export async function getOwnedChatbot(chatbotId: string, userId: string) {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: "chatbots",
      Key: { id: chatbotId },
    })
  )
  const chatbot = result.Item as ChatbotRecord | undefined
  return chatbot?.userId === userId ? chatbot : null
}