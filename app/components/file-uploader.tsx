"use client"

import { useRef, useState } from "react"
import {
  IconCheck,
  IconCloudUpload,
  IconFile,
  IconLoader2,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"

const MAX_FILE_SIZE = 100 * 1024 * 1024

type UploadState = "idle" | "uploading" | "success" | "error"

export function FileUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function chooseFile(nextFile?: File) {
    if (!nextFile) return

    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null)
      setError("That file is larger than the 100 MB limit.")
      setUploadState("error")
      return
    }

    setFile(nextFile)
    setError(null)
    setUploadedKey(null)
    setProgress(0)
    setUploadState("idle")
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0])
  }

  function clearFile() {
    setFile(null)
    setError(null)
    setProgress(0)
    setUploadedKey(null)
    setUploadState("idle")
    if (inputRef.current) inputRef.current.value = ""
  }

  async function uploadFile() {
    if (!file) return

    setUploadState("uploading")
    setProgress(0)
    setError(null)

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      })

      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Could not prepare the upload.")

      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open("PUT", data.url)
        request.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream"
        )
        request.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100))
          }
        })
        request.addEventListener("load", () => {
          if (request.status >= 200 && request.status < 300) resolve()
          else reject(new Error("S3 rejected the file upload."))
        })
        request.addEventListener("error", () =>
          reject(new Error("The upload failed."))
        )
        request.send(file)
      })

      setProgress(100)
      setUploadedKey(data.key)
      setUploadState("success")
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The upload failed."
      )
      setUploadState("error")
    }
  }

  const isUploading = uploadState === "uploading"

  return (
    <section className="w-full max-w-xl rounded-3xl border border-black/10 bg-white/90 p-2 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/90">
      <div
        className={`rounded-[1.35rem] border border-dashed p-8 transition-colors sm:p-12 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
            : "border-zinc-300 bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-950/40"
        }`}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          chooseFile(event.dataTransfer.files[0])
        }}
      >
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          onChange={handleFileInput}
          disabled={isUploading}
        />

        {uploadState === "success" ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <IconCheck size={30} stroke={2.5} />
            </div>
            <p className="text-lg font-semibold tracking-tight">
              Upload complete
            </p>
            <p className="mt-1 max-w-sm truncate text-sm text-zinc-500">
              {file?.name}
            </p>
            <p className="mt-4 max-w-full truncate rounded-md bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
              {uploadedKey}
            </p>
            <button
              type="button"
              onClick={clearFile}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              <IconRefresh size={17} /> Upload another file
            </button>
          </div>
        ) : file ? (
          <div>
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <IconFile size={25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{file.name}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove selected file"
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <IconX size={19} />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="mt-7">
                <div className="mb-2 flex justify-between text-xs font-medium text-zinc-500">
                  <span>Uploading to S3</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadState === "error" && (
              <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={uploadFile}
              disabled={isUploading}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isUploading ? (
                <IconLoader2 className="animate-spin" size={18} />
              ) : (
                <IconCloudUpload size={18} />
              )}
              {isUploading
                ? "Uploading..."
                : uploadState === "error"
                  ? "Try again"
                  : "Upload file"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <IconCloudUpload size={31} />
            </div>
            <p className="text-lg font-semibold tracking-tight">
              Drop a file here
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              or choose one from your device
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Choose file
            </button>
            <p className="mt-5 text-xs text-zinc-400">
              Maximum file size: 100 MB
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
