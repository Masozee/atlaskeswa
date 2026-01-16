"use client"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

interface IconProps {
  icon: IconSvgElement
  className?: string
  size?: number
  color?: string
  strokeWidth?: number
}

export function Icon({ icon, className, size = 24, color = "currentColor", strokeWidth = 1.5 }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  )
}

// Re-export HugeiconsIcon for direct usage
export { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

// Re-export all icons from core-free-icons
export * from "@hugeicons/core-free-icons"
