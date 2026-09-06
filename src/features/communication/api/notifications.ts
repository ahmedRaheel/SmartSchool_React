import { api } from "../../../core/api/ApiClient";

export type NotificationItem = {
  tenantId: string;
  id: string;
  recipientUserId: string;
  type: string | number;
  title: string;
  message: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  actionUrl?: string | null;
  priority: string;
  isRead: boolean;
  readAt?: string | null;
  occurredAt: string;
};

type Page<T> = { items: T[]; page: number; pageSize: number; totalCount: number };

export async function getNotifications(tenantId: string, userId: string) {
  try {
    const r = await api.get<Page<NotificationItem>>("/api/communication/notification", {
      params: { tenantId, recipientUserId: userId, page: 1, pageSize: 30 },
    });
    return (r as any).data;
  } catch (err: any) {
    console.error("[notifications] getNotifications:", err?.message ?? err);
    return { items: [], page: 1, pageSize: 30, totalCount: 0 };
  }
}

export async function getUnreadCount(tenantId: string, userId: string): Promise<number> {
  try {
    const r = await api.get<{ unreadCount: number }>("/api/communication/notification/unread-count", {
      params: { tenantId, recipientUserId: userId },
    });
    return (r as any).data.unreadCount ?? 0;
  } catch (err: any) {
    console.error("[notifications] getUnreadCount:", err?.message ?? err);
    return 0;
  }
}

export async function markRead(tenantId: string, userId: string, id: string): Promise<void> {
  try {
    await api.patch(`/api/communication/notification/${id}/read`, null, {
      params: { tenantId, recipientUserId: userId },
    });
  } catch (err: any) {
    console.error("[notifications] markRead:", err?.message ?? err);
  }
}

export async function markAllRead(tenantId: string, userId: string): Promise<void> {
  try {
    await api.patch("/api/communication/notification/read-all", null, {
      params: { tenantId, recipientUserId: userId },
    });
  } catch (err: any) {
    console.error("[notifications] markAllRead:", err?.message ?? err);
  }
}
