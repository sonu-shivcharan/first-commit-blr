import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs"

export default async function Page() {
  const { userId } = await auth()

  if (userId) {
    redirect("/app")
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f4f7f2] px-5 py-12 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-size-[48px_48px] opacity-70" />
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-10">
        <header className="flex w-full items-center justify-end gap-3">
          <a href="/integration" className="text-sm text-zinc-700 dark:text-zinc-200 hover:underline mr-4">
            Integration Page
          </a>
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
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold tracking-[0.22em] text-emerald-700 uppercase dark:text-emerald-400">
            KnowledgeBaseZ
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl dark:text-white">
            Build your knowledge base.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Sign in to create a chatbot, upload source documents, and index them
            with Amazon Bedrock.
          </p>
        </div>
      </div>
    </main>
  )
}
