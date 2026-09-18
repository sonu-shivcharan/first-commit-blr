"use client"

import { FormEvent, useState } from "react"

const DUMMY_USER_ID = "demo-user-001"

type SubmitState = "idle" | "submitting" | "success" | "error"

export function ChatbotForm() {
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
        body: JSON.stringify({
          userId: DUMMY_USER_ID,
          name,
          description,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not create the chatbot.")
      }

      setName("")
      setDescription("")
      setSubmitState("success")
      setMessage(`Chatbot created with ID ${data.id}.`)
    } catch (error) {
      setSubmitState("error")
      setMessage(
        error instanceof Error ? error.message : "Could not create the chatbot."
      )
    }
  }

  const isSubmitting = submitState === "submitting"

  return (
    <section className="w-full max-w-xl rounded-3xl border border-black/10 bg-white/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
      <div className="mb-6">
        <p className="text-xs font-bold tracking-[0.2em] text-emerald-700 uppercase dark:text-emerald-400">
          Chatbot setup
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Create a chatbot
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          This demo request uses user ID{" "}
          <span className="font-mono">{DUMMY_USER_ID}</span>.
        </p>
      </div>

      <form className="space-y-5" onSubmit={createChatbot}>
        <label className="block">
          <span className="text-sm font-medium">Chatbot name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Support assistant"
            className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what this chatbot should help with"
            rows={4}
            className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create chatbot"}
        </button>

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
    </section>
  )
}
