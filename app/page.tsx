import { ChatbotForm } from "@/app/components/chatbot-form"
import { FileUploader } from "@/app/components/file-uploader"

export default function Page() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f4f7f2] px-5 py-12 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] [background-size:48px_48px] opacity-70" />
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-10">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold tracking-[0.22em] text-emerald-700 uppercase dark:text-emerald-400">
            Secure file transfer
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl dark:text-white">
            Send it to the cloud.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Your file is uploaded directly to Amazon S3 using a short-lived
            signed URL.
          </p>
        </div>
        <FileUploader />
        <ChatbotForm />
      </div>
    </main>
  )
}
