import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === process.env.ADMIN_PASSWORD) {
      const response = NextResponse.json({ message: 'Login realizado com sucesso' })
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}
