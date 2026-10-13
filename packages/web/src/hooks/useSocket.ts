import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { EventType, type ClerkEventEnvelope } from '@clerk/shared'
import { useAuthStore } from '../stores/auth'
import { useAgentsStore } from '../stores/agents'

/** Connects to the API's Socket.IO server; the server joins us to our tenant room after JWT auth. */
export function useSocket(): Socket | null {
  const token = useAuthStore((s) => s.token)
  const pushActivity = useAgentsStore((s) => s.pushActivity)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!token) return
    const s = io(import.meta.env.VITE_API_URL, { auth: { token } })
    s.on(EventType.AgentAction, (event: ClerkEventEnvelope<EventType.AgentAction>) => {
      pushActivity({ ...event.payload, timestamp: event.timestamp })
    })
    // TODO: implement — subscribe to transaction/forecast/insight events and update the relevant stores.
    setSocket(s)
    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [token, pushActivity])

  return socket
}
