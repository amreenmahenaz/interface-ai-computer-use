import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ ok: true, message: 'Theta API route is available' });
  } catch (error) {
    console.error('Theta init failed:', error);
    return NextResponse.json({ ok: false, message: 'Theta init failed' }, { status: 500 });
  }
}
