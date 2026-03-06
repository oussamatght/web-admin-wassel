import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'ws://localhost:5000'
let instance: Socket | null = null

export function connectSocket(token: string): void {
  if (instance?.connected) return
  instance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })
  instance.on('connect', () => console.log('[Socket] Connected:', instance?.id))
  instance.on('disconnect', () => console.log('[Socket] Disconnected'))
  instance.on('connect_error', (err) => console.error('[Socket] Error:', err.message))
}

export function disconnectSocket(): void {
  instance?.disconnect()
  instance = null
}

export function getSocket(): Socket | null {
  return instance
}
