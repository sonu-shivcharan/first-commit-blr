import { UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { ChatbotWorkspace } from "@/components/chatbots/chatbot-workspace"

export default async function AppPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f4f7f2] px-5 py-8 sm:px-10 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70" />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center">
        <header className="flex w-full items-center justify-between border-b border-zinc-200/80 pb-5 dark:border-zinc-800">
          <p className="text-xs font-bold tracking-[0.22em] text-emerald-700 uppercase dark:text-emerald-400">
            KnowledgeBaseZ
          </p>
          <UserButton />
        </header>
        <div className="w-full py-10 text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white">
            Your chatbots
          </h1>
        </div>
        <ChatbotWorkspace />
      </div>
    </main>
  )
}
