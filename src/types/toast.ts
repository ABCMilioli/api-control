import * as React from "react"

export type ToastActionElement = React.ReactElement

export type ToastVariant = "default" | "destructive" | "success" | "warning"

export interface ToastProps {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: ToastVariant
} 