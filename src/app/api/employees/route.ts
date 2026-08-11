import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, getOrCreateEmployee } from '@/lib/db';

export async function GET() {
  try {
    const employees = await getEmployees();
    return NextResponse.json({
      success: true,
      data: employees
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const emp = await getOrCreateEmployee(body.name, body.legajo, body.phone);
    return NextResponse.json({ success: true, data: emp }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create employee', details: error.message },
      { status: 500 }
    );
  }
}
