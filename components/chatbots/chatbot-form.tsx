"use client"

import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SubmitState = "idle" | "submitting" | "success" | "error"

type Chatbot = {
  id: string
  name: string
  description: string
  knowledgeBaseId: string
  dataSourceId: string | null
  provisioningStatus: string
}

type ChatbotFormProps = {
  onCreated: (chatbot: Chatbot) => void
}

export function ChatbotForm({ onCreated }: ChatbotFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [message, setMessage] = useState("")

  async function createChatbot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitState("submitting")
    setMessage("")

    try {
      const response = await fetch("/api/chatbots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not create the chatbot.")
      }

      setName("")
      setDescription("")
      setSubmitState("success")
      setMessage("Chatbot created. Setting up its knowledge base...")
      onCreated(data as Chatbot)
    } catch (error) {
      setSubmitState("error")
      setMessage(
        error instanceof Error ? error.message : "Could not create the chatbot."
      )
    }
  }

  const isSubmitting = submitState === "submitting"

  return (
    <form className="space-y-5" onSubmit={createChatbot}>
      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <Input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Support assistant"
          className="mt-2 h-11 rounded-xl border-input bg-background px-3"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">What should it help with?</span>
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Answer questions about our support policies"
          rows={4}
          className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm transition outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl"
      >
        {isSubmitting ? "Creating..." : "Create chatbot"}
      </Button>

      {message && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-sm ${
            submitState === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  )
}
