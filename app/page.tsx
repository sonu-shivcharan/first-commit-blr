import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs"
import {
  IconArrowRight,
  IconCpu,
  IconFileText,
  IconSparkles,
  IconWorld,
} from "@tabler/icons-react"

export default async function Page() {
  const { userId } = await auth()

  if (userId) {
    redirect("/app")
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f4f7f2] px-5 py-12 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70" />
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-8">
        <header className="flex w-full items-center justify-end gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/app">
              <button className="rounded-none border border-zinc-300 px-4 py-2 text-xs font-semibold tracking-widest text-zinc-700 uppercase transition-colors hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/app">
              <button className="rounded-none bg-emerald-700 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400">
                Sign up
              </button>
            </SignUpButton>
          </Show>
        </header>

        <div className="text-center">
          <p className="mb-3 text-xs font-bold tracking-[0.22em] text-emerald-700 uppercase dark:text-emerald-400">
            KnowledgeBaseZ
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl dark:text-white">
            Build AI chatbot Instantly and Integrate.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Upload documents and AI answers your questions instantly with Amazon
            Bedrock.
          </p>
        </div>

        {/* Highlight Box showing the main idea */}
        <div className="w-full max-w-xl rounded-2xl border border-emerald-500/25 bg-white/10 p-6 backdrop-blur-md shadow-lg shadow-emerald-500/5 dark:border-emerald-500/20 dark:bg-zinc-900/20">
          <div className="flex items-center justify-between border-b border-zinc-200/70 pb-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <span className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
              How It Works
            </span>
            <span>Instant Setup • No Training Required</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200/80 bg-white/20 p-3.5 text-left backdrop-blur-sm transition hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-white/[0.03]">
              <IconFileText className="size-5 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                1. Upload Docs
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-white/20 p-3.5 text-left backdrop-blur-sm transition hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-white/[0.03]">
              <IconCpu className="size-5 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                2. Bedrock RAG
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-white/20 p-3.5 text-left backdrop-blur-sm transition hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-white/[0.03]">
              <IconWorld className="size-5 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                3. Integrate & Chat
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center pt-1">
            <SignUpButton mode="modal" fallbackRedirectUrl="/app">
              <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase shadow-md shadow-emerald-700/20 transition-all hover:bg-emerald-800 hover:shadow-lg dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400">
                Create Your Chatbot Now
                <IconArrowRight className="size-3.5" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </main>
  )
}
