import { NextRequest } from 'next/server'

export function isAdminAuth(request: NextRequest): boolean {
  return request.cookies.get('admin_session')?.value === 'authenticated'
}

export interface ClientSession {
  slug: string
  eventoId: number
}

export function getClientSession(request: NextRequest): ClientSession | null {
  const value = request.cookies.get('evento_client_session')?.value
  if (!value) return null
  try {
    return JSON.parse(value) as ClientSession
  } catch {
    return null
  }
}
