import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const password = 'admin123456'
    const hash = await bcrypt.hash(password, 10)
    const verify = await bcrypt.compare(password, hash)
    
    return NextResponse.json({
      password,
      hash,
      verify,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
