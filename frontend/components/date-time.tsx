"use client"

import * as React from "react"

export function DateTime() {
  const [currentTime, setCurrentTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-xs text-muted-foreground">{formatDate(currentTime)}</span>
      <span className="text-[10px] font-mono text-muted-foreground">{formatTime(currentTime)}</span>
    </div>
  )
}
