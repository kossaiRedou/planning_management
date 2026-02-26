"use client"

import Image from "next/image"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="loading-logo">
          <Image
            src="/logochargmentdepage.png"
            alt="ShiftMe"
            width={120}
            height={120}
            priority
            className="select-none"
          />
        </div>
        <div className="flex gap-1.5">
          <span className="loading-dot" style={{ animationDelay: "0ms" }} />
          <span className="loading-dot" style={{ animationDelay: "150ms" }} />
          <span className="loading-dot" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  )
}
