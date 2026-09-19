"use client"

import { useEffect, useState } from "react"

import { ChatbotForm } from "@/components/chatbots/chatbot-form"
import { FileUploader } from "@/components/chatbots/file-uploader"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Chatbot = {
  id: string
  name: string
  description: string
  knowledgeBaseId: string
  dataSourceId: string | null
  provisioningStatus: string
}

export function ChatbotWorkspace() {
  const [showForm, setShowForm] = useState(false)
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadChatbots() {
      try {
        const response = await fetch("/api/chatbots")
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || "Could not load chatbots.")
        }

        const loadedChatbots = data as Chatbot[]
        setChatbots(loadedChatbots)
        setChatbot(loadedChatbots[0] ?? null)
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Could not load chatbots."
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadChatbots()
  }, [])

  useEffect(() => {
    if (!chatbot || chatbot.dataSourceId) return

    const chatbotId = chatbot.id
    let cancelled = false
    let attempts = 0
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function checkStatus() {
      attempts += 1
      try {
        const response = await fetch(`/api/chatbots/${chatbotId}/status`)
        const data = await response.json()
        if (!response.ok)
          throw new Error(data.error || "Could not check setup status.")
        if (cancelled) return

        setChatbot((current) =>
          current
            ? {
                ...current,
                dataSourceId: data.dataSourceId ?? current.dataSourceId,
                provisioningStatus: data.status,
              }
            : current
        )

        if (data.status === "READY") return
        if (data.status === "FAILED" || attempts >= 20) {
          setChatbot((current) =>
            current ? { ...current, provisioningStatus: "FAILED" } : current
          )
          return
        }
      } catch {
        if (!cancelled && attempts >= 20) {
          setChatbot((current) =>
            current ? { ...current, provisioningStatus: "FAILED" } : current
          )
          return
        }
      }

      if (!cancelled) {
        timeoutId = setTimeout(checkStatus, 3000)
      }
    }

    checkStatus()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [chatbot?.dataSourceId, chatbot?.id])

  return (
    <section className="w-full max-w-xl">
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading your chatbots...
            </p>
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
          </CardContent>
        </Card>
      ) : chatbots.length > 0 ? (
        <div className="w-full space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-emerald-700 uppercase dark:text-emerald-400">
                  Your chatbots
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  Choose an assistant
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="h-10 shrink-0 bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
              >
                Create chatbot
              </button>
            </div>
            <div className="grid gap-2">
              {chatbots.map((item) => (
                <Card
                  key={item.id}
                  size="sm"
                  className={`p-0 transition-colors ${
                    chatbot?.id === item.id
                      ? "ring-2 ring-primary"
                      : "hover:ring-2 hover:ring-primary/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setChatbot(item)}
                    className="w-full px-4 py-3 text-left"
                  >
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </button>
                </Card>
              ))}
            </div>
          </div>

          {chatbot && chatbot.dataSourceId ? (
            <div className="w-full space-y-6">
              <FileUploader chatbotId={chatbot.id} />
            </div>
          ) : chatbot ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm font-semibold">
                  {chatbot.provisioningStatus === "FAILED"
                    ? "Knowledge base setup failed."
                    : "Setting up your knowledge base..."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {chatbot.provisioningStatus === "FAILED"
                    ? "Check your AWS configuration and try creating the chatbot again."
                    : "We are checking its status every few seconds. Uploads will appear when it is ready."}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No chatbots yet</CardTitle>
            <CardDescription>
              Create your first assistant to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="h-11 w-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Create chatbot
            </button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create a chatbot</DialogTitle>
            <DialogDescription>
              Add a name and tell it what to help with.
            </DialogDescription>
          </DialogHeader>
          <ChatbotForm
            onCreated={(createdChatbot) => {
              setChatbots((current) => [createdChatbot, ...current])
              setChatbot(createdChatbot)
              setShowForm(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  )
}
