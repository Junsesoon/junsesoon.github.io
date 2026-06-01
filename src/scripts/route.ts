import { NextRequest, NextResponse } from 'next/server';
import { query } from '../infra/db';

export async function GET() {
  try {
    // Fetch all properties grouped by template_name
    const result = await query(`
      SELECT id, template_name, property_key, is_required
      FROM templates
      ORDER BY template_name ASC, created_at ASC
    `);

    // Record<string, Array<{ id, property_key, is_required }>> 형태로 데이터 가공
    const grouped: Record<string, Array<{ id: number; property_key: string; is_required: boolean }>> = {};

    result.rows.forEach((row) => {
      if (!grouped[row.template_name]) {
        grouped[row.template_name] = [];
      }
      grouped[row.template_name].push({
        id: row.id,
        property_key: row.property_key,
        is_required: row.is_required,
      });
    });

    return NextResponse.json(grouped, { status: 200 });
  } catch (error) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { template_name, property_key, is_required } = body;

    if (!template_name || !property_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // $1, $2, $3를 사용하여 SQL 인젝션 방지 및 Insert 수행
    const result = await query(
      `INSERT INTO templates (template_name, property_key, is_required)
       VALUES ($1, $2, $3)
       RETURNING id, template_name, property_key, is_required`,
      [template_name, property_key, Boolean(is_required)]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('POST /api/templates error:', error);
    // PostgreSQL 23505 에러: UNIQUE 제약조건 위반 (동일한 속성이 이미 존재함)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Property key already exists for this template' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    await query('DELETE FROM templates WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/templates error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}