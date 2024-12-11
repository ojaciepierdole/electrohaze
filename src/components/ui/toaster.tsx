"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, message, type }) => (
        <Toast key={id} variant={type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default'}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {message && <ToastDescription>{message}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
} 