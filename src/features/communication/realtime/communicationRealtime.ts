import * as signalR from "@microsoft/signalr";
import { env } from "../../../config/env";
import type { NotificationItem } from "../api/notifications";

const getToken = () =>
  localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token") ?? "";

function buildConnection(path: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${env.apiBaseUrl}${path}`, { accessTokenFactory: getToken })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

export function createNotificationConnection(
  onNotification: (notification: NotificationItem) => void,
): signalR.HubConnection {
  const hub = buildConnection("/hubs/notifications");
  hub.on("NotificationReceived", onNotification);
  return hub;
}

export function createChatConnection(
  onMessage: (message: unknown) => void,
): signalR.HubConnection {
  const hub = buildConnection("/hubs/chat");
  hub.on("MessageReceived", onMessage);
  return hub;
}

export async function joinConversation(
  hub: signalR.HubConnection,
  tenantId: string,
  conversationId: string,
): Promise<void> {
  try {
    await hub.invoke("JoinConversation", tenantId, conversationId);
  } catch (err: any) {
    console.error("[realtime] joinConversation:", err?.message ?? err);
  }
}

export async function sendChatMessage(
  hub: signalR.HubConnection,
  tenantId: string,
  conversationId: string,
  message: string,
): Promise<void> {
  try {
    await hub.invoke("SendMessage", tenantId, conversationId, message);
  } catch (err: any) {
    console.error("[realtime] sendMessage:", err?.message ?? err);
  }
}

export async function startConnection(hub: signalR.HubConnection): Promise<void> {
  try {
    await hub.start();
  } catch (err: any) {
    console.error("[realtime] start:", err?.message ?? err);
  }
}
