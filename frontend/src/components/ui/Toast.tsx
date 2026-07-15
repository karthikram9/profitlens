import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type Listener = (messages: ToastMessage[]) => void;
let listeners: Listener[] = [];
let messages: ToastMessage[] = [];

export const toast = {
  success(message: string, duration = 3000) {
    this.add('success', message, duration);
  },
  error(message: string, duration = 4000) {
    this.add('error', message, duration);
  },
  info(message: string, duration = 3000) {
    this.add('info', message, duration);
  },
  add(type: ToastType, message: string, duration: number) {
    const id = Math.random().toString(36).substring(2, 9);
    const newMessage = { id, type, message, duration };
    messages = [...messages, newMessage];
    listeners.forEach((listener) => listener(messages));
    
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  },
  remove(id: string) {
    messages = messages.filter((m) => m.id !== id);
    listeners.forEach((listener) => listener(messages));
  },
  subscribe(listener: Listener) {
    listeners.push(listener);
    listener(messages);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-lg right-lg z-50 flex flex-col gap-sm w-full max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<ToastMessage> = ({ id, type, message }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertTriangle className="h-5 w-5 text-danger" />,
    info: <Info className="h-5 w-5 text-info" />,
  };

  const borders = {
    success: 'border-success/20 bg-success-bg text-success',
    error: 'border-danger/20 bg-danger-bg text-danger',
    info: 'border-info/20 bg-info-bg text-info',
  };

  return (
    <div
      className={cn(
        "flex items-start gap-md p-md rounded-lg border shadow-md backdrop-blur-sm transition-all duration-base text-text-primary",
        borders[type]
      )}
    >
      <div className="flex-shrink-0 mt-[2px]">{icons[type]}</div>
      <div className="flex-1 text-sm font-semibold">{message}</div>
      <button
        onClick={() => toast.remove(id)}
        className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors duration-fast ml-xs"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
