import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"

import { ChatbotDetail } from "@/components/chatbots/chatbot-detail"
import { getOwnedChatbot } from "@/lib/aws/chatbots"

export default async function ChatbotPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const { chatbotId } = await params
  const chatbot = await getOwnedChatbot(chatbotId, userId)
  if (!chatbot) notFound()

  return <ChatbotDetail chatbot={chatbot} />
}
