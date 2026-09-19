import { notFound } from "next/navigation"

import { PublicChat } from "@/components/chatbots/public-chat"
import { getChatbot } from "@/lib/aws/chatbots"

export default async function PublicChatPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>
}) {
  const { chatbotId } = await params
  const chatbot = await getChatbot(chatbotId)
  if (!chatbot) notFound()

  return (
    <PublicChat
      chatbotId={chatbot.id}
      name={chatbot.name}
      description={chatbot.description}
    />
  )
}
