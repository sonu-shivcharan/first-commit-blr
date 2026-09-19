"use client"

import { KeyboardEvent, useState } from "react"
import { IconSend } from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type PublicChatProps = {
  chatbotId: string
  name: string
  description: string
}

export function PublicChat({ chatbotId, name, description }: PublicChatProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([])
  const [isSending, setIsSending] = useState(false)
  const [sessionId, setSessionId] = useState("")

  function getStoredSessionId() {
    if (sessionId) return sessionId
    return window.localStorage.getItem(`chatbot-session-v2:${chatbotId}`)
  }

  async function sendMessage() {
    const nextMessage = message.trim()
    if (!nextMessage || isSending) return

    setMessages((current) => [...current, { role: "user", text: nextMessage }])
    setMessage("")
    setIsSending(true)

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/public-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nextMessage,
          ...(getStoredSessionId() ? { sessionId: getStoredSessionId() } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "The chatbot could not answer.")
      setMessages((current) => [...current, { role: "bot", text: data.answer }])
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
        window.localStorage.setItem(
          `chatbot-session-v2:${chatbotId}`,
          data.sessionId
        )
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text:
            error instanceof Error
              ? error.message
              : "The chatbot could not answer.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  function handleMessageKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <main className="min-h-[100dvh] bg-muted/30 text-foreground sm:p-6">
      <Card className="mx-0 mx-auto my-0 flex h-[calc(100dvh-1.5rem)] max-w-7xl flex-col gap-0 sm:h-[calc(100dvh-3rem)]">
        <CardHeader className="shrink-0 border-b border-border sm:px-4">
          <CardTitle className="text-base tracking-normal normal-case sm:text-lg">
            {name}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs sm:text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col px-0 py-0">
          <div
            className="min-h-0 flex-1 [scrollbar-width:none] space-y-4 overflow-y-auto px-4 py-5 sm:px-6 [&::-webkit-scrollbar]:hidden"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-full items-center justify-center text-center">
                <div className="max-w-xs">
                  <p className="text-sm font-medium">How can I help?</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Ask a question about the company information I know.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 break-words whitespace-pre-wrap shadow-sm sm:max-w-[78%] ${
                      item.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground"
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder="Ask a question"
                aria-label="Your question"
                className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm transition outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isSending || !message.trim()}
                aria-label={isSending ? "Sending message" : "Send message"}
                title={isSending ? "Sending message" : "Send message"}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                <IconSend size={18} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
