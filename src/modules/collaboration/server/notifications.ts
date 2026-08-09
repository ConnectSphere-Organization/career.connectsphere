import "server-only";

import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/http/api-error";

export async function listNotifications(userId: string, unreadOnly = false) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        priority: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        job: { select: { slug: true, title: true } },
      },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications, unreadCount };
}

export async function listAdminNotifications() {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      priority: true,
      isRead: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      job: { select: { slug: true, title: true } },
    },
  });
}

export async function markNotificationRead(id: string, userId: string) {
  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true, readAt: new Date() },
  });
  if (result.count !== 1) throw new ApiError("Notification not found", 404);
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function deleteNotification(id: string, userId: string) {
  const result = await prisma.notification.deleteMany({
    where: { id, userId },
  });
  if (result.count !== 1) throw new ApiError("Notification not found", 404);
}
