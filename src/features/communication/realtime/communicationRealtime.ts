import * as signalR from "@microsoft/signalr";
import { env } from "../../../config/env";
import type { NotificationItem } from "../api/notifications";

const token = () => (localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token")) ?? "";

function connection(path: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${env.apiBaseUrl}${path}`, { accessTokenFactory: token })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

export function createNotificationConnection(onNotification: (notification: NotificationItem) => void) {
  const hub = connection("/hubs/notifications");
  hub.on("NotificationReceived", onNotification);
  return hub;
}

export function createChatConnection(onMessage: (message: unknown) => void) {
  const hub = connection("/hubs/chat");
  hub.on("MessageReceived", onMessage);
  return hub;
}

export async function joinConversation(hub: signalR.HubConnection, tenantId: string, conversationId: string) {
  await hub.invoke("JoinConversation", tenantId, conversationId);
}

export async function leaveConversation(hub: signalR.HubConnection, tenantId: string, conversationId: string) {
  await hub.invoke("LeaveConversation", tenantId, conversationId);
}

export async function sendRealtimeMessage(hub: signalR.HubConnection, tenantId: string, conversationId: string, message: string) {
  await hub.invoke("SendMessage", tenantId, conversationId, message);
}
