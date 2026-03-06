"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";

/**
 * Listen to a socket event and call a handler whenever it fires.
 * Automatically cleans up the listener on unmount.
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void
) {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const listener = (data: T) => savedHandler.current(data);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}

/**
 * Returns an emit function bound to the current socket instance.
 */
export function useSocketEmit() {
  return useCallback((event: string, ...args: unknown[]) => {
    const socket = getSocket();
    if (!socket?.connected) {
      console.warn("[useSocketEmit] Socket not connected, cannot emit:", event);
      return;
    }
    socket.emit(event, ...args);
  }, []);
}

/**
 * Listen to a socket event and automatically invalidate react-query keys.
 */
export function useSocketInvalidate(
  event: string,
  queryKeys: string[][]
) {
  const queryClient = useQueryClient();

  useSocketEvent(event, () => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  });
}
