"use client"

import { FormEvent, useEffect, useState } from "react"
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconSend,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import { FileUploader } from "@/components/chatbots/file-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  provisioningStatus?: string
}

type SourceFile = {
  name: string
  size: number
  uploadedAt: string | null
}

type ChatbotDetailProps = {
  chatbot: Chatbot
}

type Tab = "details" | "sources" | "test"

export function ChatbotDetail({ chatbot }: ChatbotDetailProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("details")
  const [files, setFiles] = useState<SourceFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [dataSourcePrompt, setDataSourcePrompt] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([])
  const [isSending, setIsSending] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [publicUrl, setPublicUrl] = useState(`/chatbots/${chatbot.id}/public`)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setPublicUrl(`${window.location.origin}/chatbots/${chatbot.id}/public`)
  }, [chatbot.id])

  async function loadFiles() {
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/documents`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load files.")
      const loadedFiles = (data as SourceFile[]) || []
      setFiles(loadedFiles)
      if (loadedFiles.length === 0) {
        setTab("sources")
        setDataSourcePrompt(
          "At least one datasource is required. Please add a data source first."
        )
      } else {
        setDataSourcePrompt(null)
      }
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : "Could not load files."
      )
    }
  }

  useEffect(() => {
    loadFiles()
  }, [chatbot.id])

  function handleTabChange(nextTab: Tab) {
    if (nextTab === "test" && files.length === 0) {
      setTab("sources")
      setDataSourcePrompt(
        "At least one datasource is required. Please add a data source first."
      )
      return
    }
    setTab(nextTab)
  }

  function handleTestChatClick() {
    if (files.length === 0) {
      setTab("sources")
      setDataSourcePrompt(
        "At least one datasource is required. Please add a data source first."
      )
      return
    }
    setTab("test")
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (files.length === 0) {
      setTab("sources")
      setDataSourcePrompt(
        "At least one datasource is required. Please add a data source first."
      )
      return
    }
    const nextMessage = message.trim()
    if (!nextMessage || isSending) return

    setMessages((current) => [...current, { role: "user", text: nextMessage }])
    setMessage("")
    setIsSending(true)

    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/public-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nextMessage,
          ...(sessionId ? { sessionId } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "The chatbot could not answer.")
      setMessages((current) => [...current, { role: "bot", text: data.answer }])
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
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

  async function copyPublicLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl)
      } else {
        copyWithTemporaryTextarea(publicUrl)
      }
      setIsLinkCopied(true)
      window.setTimeout(() => setIsLinkCopied(false), 1800)
    } catch {
      copyWithTemporaryTextarea(publicUrl)
      setIsLinkCopied(true)
      window.setTimeout(() => setIsLinkCopied(false), 1800)
    }
    setTab("details")
  }

  async function deleteChatbot() {
    if (deleteConfirmation !== chatbot.name || isDeleting) return

    setIsDeleting(true)
    setDeleteError(null)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Could not delete chatbot.")
      router.push("/app")
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete chatbot."
      )
      setIsDeleting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Chatbot
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {chatbot.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {chatbot.description}
          </p>
        </div>
        <Button
          type="button"
          onClick={handleTestChatClick}
          variant="outline"
        >
          Test chat
        </Button>
        <Button
          type="button"
          onClick={copyPublicLink}
          variant="outline"
          size="icon"
          aria-label={isLinkCopied ? "Public link copied" : "Copy public link"}
          title={isLinkCopied ? "Public link copied" : "Copy public link"}
        >
          {isLinkCopied ? <IconCheck /> : <IconCopy />}
        </Button>
      </div>

      {dataSourcePrompt && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <div className="flex items-start gap-3">
            <IconAlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold">Data source required</p>
              <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">
                {dataSourcePrompt}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDataSourcePrompt(null)}
            className="rounded p-1 text-amber-700 hover:bg-amber-500/20 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-200"
            aria-label="Dismiss alert"
          >
            <IconX className="size-4" />
          </button>
        </div>
      )}

      <div
        className="mb-6 flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Chatbot sections"
      >
        {(["details", "sources", "test"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => handleTabChange(item)}
            className={`border-b-2 px-4 py-3 text-sm font-medium capitalize transition ${
              tab === item
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item === "test" ? "Test chat" : item}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>About this chatbot</CardTitle>
              <CardDescription>
                What visitors will use this assistant for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {chatbot.description}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Public access</CardTitle>
              <CardDescription>
                Anyone with this link can chat without signing in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="rounded-md bg-muted px-3 py-2 text-xs break-all text-muted-foreground">
                {publicUrl}
              </p>
              <Button
                type="button"
                onClick={copyPublicLink}
                variant="outline"
                size="icon-sm"
                aria-label={
                  isLinkCopied ? "Public link copied" : "Copy public link"
                }
                title={isLinkCopied ? "Public link copied" : "Copy public link"}
              >
                {isLinkCopied ? <IconCheck /> : <IconCopy />}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "sources" && (
        <div className="space-y-5">
          <FileUploader chatbotId={chatbot.id} onUploadComplete={loadFiles} />
          <Card>
            <CardHeader>
              <CardTitle>Uploaded files</CardTitle>
              <CardDescription>
                These files are used as the chatbot's knowledge sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fileError ? (
                <p className="text-sm text-destructive">{fileError}</p>
              ) : files.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No files uploaded yet. At least one datasource is required.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {files.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "test" && (
        <Card>
          <CardHeader>
            <CardTitle>Test your chatbot</CardTitle>
            <CardDescription>
              Ask a question and check the answer before sharing it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 min-h-40 space-y-3 rounded-md bg-muted p-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ask something about your uploaded files.
                </p>
              ) : (
                messages.map((item, index) => (
                  <p
                    key={`${item.role}-${index}`}
                    className={`text-sm ${item.role === "user" ? "text-right" : "text-left"}`}
                  >
                    <span className="inline-block max-w-[85%] rounded-md bg-background px-3 py-2 text-left">
                      {item.text}
                    </span>
                  </p>
                ))
              )}
            </div>
            <form className="flex gap-2" onSubmit={sendMessage}>
              <Input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask a question"
                className="h-10 min-w-0 flex-1 border-input bg-background px-3"
              />
              <Button
                type="submit"
                disabled={isSending}
                size="icon"
                aria-label={isSending ? "Sending message" : "Send message"}
                title={isSending ? "Sending message" : "Send message"}
              >
                <IconSend />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mt-10 border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting this chatbot permanently removes its knowledge base files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog
            onOpenChange={(open) => {
              if (!open) {
                setDeleteConfirmation("")
                setDeleteError(null)
              }
            }}
          >
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  aria-label="Delete chatbot"
                />
              }
            >
              <IconTrash />
              Delete chatbot
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {chatbot.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the chatbot and its uploaded files.
                  Type <strong>{chatbot.name}</strong> to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={chatbot.name}
                aria-label="Type chatbot name to confirm deletion"
                disabled={isDeleting}
              />
              {deleteError && (
                <p className="text-sm text-destructive">{deleteError}</p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={deleteConfirmation !== chatbot.name || isDeleting}
                  onClick={deleteChatbot}
                >
                  {isDeleting ? "Deleting..." : "Delete chatbot"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </main>
  )
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function copyWithTemporaryTextarea(value: string) {
  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  textarea.remove()
}
