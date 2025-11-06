import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/notificationStore';

const severityStyles: Record<string, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-red-50 text-red-800 border-red-200',
};

const NotificationCenter = () => {
  const { t } = useTranslation();
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    [notifications]
  );

  if (sortedNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {sortedNotifications.map((notification) => {
        const severityClass = severityStyles[notification.severity] ?? severityStyles.info;
        const text = notification.translationKey
          ? t(notification.translationKey, notification.params)
          : notification.message;
        const description =
          typeof notification.metadata?.description === 'string'
            ? notification.metadata.description
            : undefined;

        return (
          <div
            key={notification.id}
            className={`border shadow-sm rounded-lg px-4 py-3 text-sm flex items-start gap-3 ${severityClass}`}
            role="status"
          >
            <div className="flex-1">
              <p className="font-medium">{text}</p>
              {description && (
                <p className="text-xs mt-1 text-gray-600">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
              aria-label={t('notifications.dismiss')}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationCenter;
