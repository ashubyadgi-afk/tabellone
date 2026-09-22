import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification(data: {
  organizationId?: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data });
}

export async function getNotificationsForUser(
  userId: string,
  organizationId?: string | null
) {
  return prisma.notification.findMany({
    where: {
      OR: [
        { userId },
        ...(organizationId ? [{ organizationId }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function getUnreadCount(userId: string, organizationId?: string | null) {
  return prisma.notification.count({
    where: {
      read: false,
      OR: [
        { userId },
        ...(organizationId ? [{ organizationId }] : []),
      ],
    },
  });
}
