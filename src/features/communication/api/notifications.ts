import { api } from "../../../core/api/ApiClient";
export type NotificationItem={tenantId:string;id:string;recipientUserId:string;type:string|number;title:string;message:string;relatedEntityId?:string|null;relatedEntityType?:string|null;actionUrl?:string|null;priority:string;isRead:boolean;readAt?:string|null;occurredAt:string};
type Page<T>={items:T[];page:number;pageSize:number;totalCount:number};

export async function getNotifications(tenantId:string,userId:string){
 const r=await api.get<Page<NotificationItem>>("/api/communication/notification",{params:{tenantId,recipientUserId:userId,page:1,pageSize:30}});
 return r.data;
}
export async function getUnreadCount(tenantId:string,userId:string){
 const r=await api.get<{unreadCount:number}>("/api/communication/notification/unread-count",{params:{tenantId,recipientUserId:userId}});
 return r.data.unreadCount;
}
export async function markRead(tenantId:string,userId:string,id:string){
 await api.patch(`/api/communication/notification/${id}/read`,null,{params:{tenantId,recipientUserId:userId}});
}
export async function markAllRead(tenantId:string,userId:string){
 await api.patch("/api/communication/notification/read-all",null,{params:{tenantId,recipientUserId:userId}});
}
