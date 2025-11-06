import { useNotificationStore } from '../store/notificationStore';
import type { NotificationSeverity, NotificationEvent } from '../store/notificationStore';

export interface TelemetryEventPayload {
  type: string;
  severity?: NotificationSeverity;
  message?: string;
  translationKey?: string;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  autoDismissMs?: number;
}

export const publishTelemetryEvent = (payload: TelemetryEventPayload) => {
  const severity: NotificationSeverity = payload.severity ?? 'info';
  const entry: Omit<NotificationEvent, 'createdAt'> = {
    id: crypto.randomUUID(),
    type: payload.type,
    severity,
    message: payload.message,
    translationKey: payload.translationKey,
    params: payload.params,
    metadata: payload.metadata,
    autoDismissMs: payload.autoDismissMs,
  };

  useNotificationStore.getState().addNotification(entry);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('telemetry:event', {
        detail: {
          ...entry,
          createdAt: new Date().toISOString(),
        },
      })
    );
  }
};
