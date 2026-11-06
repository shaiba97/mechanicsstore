import { getAccessToken } from "@/lib/auth";
import { parseStoreOrder } from "@/lib/orders";
import type { OrderStatus, StoreOrder } from "@/lib/data";

export type StoreSocketEvent =
  | { type: "order:new"; order: StoreOrder }
  | { type: "order:status"; orderId: string; status: OrderStatus }
  | { type: "inventory:update"; partId: string; qty: number };

export type SocketStatus = "connecting" | "connected" | "disconnected";

type EventListener = (event: StoreSocketEvent) => void;
type StatusListener = (status: SocketStatus) => void;

const MAX_RECONNECT_DELAY_MS = 30000;

function realtimeUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  return `${base}/ws/orders/`;
}

class StoreSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private queueIndex = 0;
  private reconnectDelay = 5000;
  private eventListeners = new Set<EventListener>();
  private statusListeners = new Set<StatusListener>();
  private currentStatus: SocketStatus = "disconnected";

  getStatus(): SocketStatus {
    return this.currentStatus;
  }

  start(): void {
    if (typeof window === "undefined") return;
    const url = realtimeUrl();
    if (url) {
      this.startRealtime(url);
    }
  }

  stop(): void {
    this.clearTimers();
    if (this.ws) {
      this.removeWsListeners();
      try {
        this.ws.close(1000);
      } catch {
        return;
      } finally {
        this.ws = null;
      }
    }
    this.setStatus("disconnected");
  }

  subscribe(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: SocketStatus): void {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private emit(event: StoreSocketEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startRealtime(url: string): void {
    if (this.ws) return;
    const token = getAccessToken();
    if (!token) {
      this.setStatus("disconnected");
      return;
    }
    this.setStatus("connecting");
    const target = new URL(url, window.location.origin);
    target.searchParams.set("token", token);
    let socket: WebSocket;
    try {
      socket = new WebSocket(target.toString());
    } catch {
      this.setStatus("disconnected");
      return;
    }
    this.ws = socket;
    socket.onopen = () => {
      this.reconnectDelay = 5000;
      this.setStatus("connected");
    };
    socket.onmessage = (message) => {
      try {
        const data = JSON.parse(String(message.data)) as Record<string, unknown>;
        if (data.type === "order:new" && data.order) {
          this.emit({
            type: "order:new",
            order: parseStoreOrder(data.order) satisfies StoreOrder,
          });
          return;
        }
        if (data.type === "order:status") {
          this.emit({
            type: "order:status",
            orderId: String(data.orderId ?? ""),
            status: data.status as OrderStatus,
          });
          return;
        }
        if (data.type === "inventory:update") {
          this.emit({
            type: "inventory:update",
            partId: String(data.partId ?? ""),
            qty: Number(data.qty ?? 0),
          });
        }
      } catch {
        return;
      }
    };
    socket.onclose = (closeEvent) => {
      if (this.ws !== socket) return;
      this.ws = null;
      if (closeEvent.code === 4401) {
        this.setStatus("disconnected");
        return;
      }
      this.scheduleReconnect();
    };
    socket.onerror = () => {
      socket.close(1000);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.setStatus("connecting");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
      const url = realtimeUrl();
      if (url) this.startRealtime(url);
    }, this.reconnectDelay);
  }

  private removeWsListeners(): void {
    const socket = this.ws;
    if (!socket) return;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
  }
}

export const storeSocket = new StoreSocket();