import { create } from 'zustand';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationEvent {
  id: string;
  type: string;
  severity: NotificationSeverity;
  message?: string;
  translationKey?: string;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  autoDismissMs?: number;
}

interface NotificationStoreState {
  notifications: NotificationEvent[];
  addNotification: (notification: Omit<NotificationEvent, 'createdAt' | 'id'> & {
    id?: string;
  }) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = notification.id ?? crypto.randomUUID();
    const autoDismissMs = notification.autoDismissMs ?? 5000;
    const entry: NotificationEvent = {
      ...notification,
      id,
      autoDismissMs,
      createdAt: new Date(),
    };

    set((state) => ({
      notifications: [...state.notifications, entry],
    }));

    if (typeof window !== 'undefined' && autoDismissMs > 0) {
      window.setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, autoDismissMs);
    }
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    })),
}));
