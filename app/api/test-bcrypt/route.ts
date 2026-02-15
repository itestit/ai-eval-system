import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const testPassword = 'admin123456'
    const testHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    
    // Test bcrypt compare
    const result = await bcrypt.compare(testPassword, testHash)
    
    return NextResponse.json({
      bcryptWorking: true,
      compareResult: result,
      hashLength: testHash.length,
    })
  } catch (error) {
    return NextResponse.json({
      bcryptWorking: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
