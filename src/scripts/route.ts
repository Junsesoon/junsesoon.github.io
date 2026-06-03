import { NextRequest, NextResponse } from 'next/server';
import { query } from '../infra/db';

export async function GET() {
  try {
    // Fetch all properties grouped by template_name
    // LEFT JOIN을 사용하여 속성이 없는 템플릿 카테고리도 가져올 수 있게 합니다.
    const result = await query(`
      SELECT tl.template_id, tl.template_name, pl.property_name, tp.is_required
      FROM template_list tl
      LEFT JOIN template_property tp ON tl.template_id = tp.template_id
      LEFT JOIN property_list pl ON tp.property_id = pl.property_id
      ORDER BY tl.template_name ASC, tp.created_at ASC
    `);

    // Record<string, Array<{ template_id, property_name, is_required }>> 형태로 데이터 가공
    const grouped: Record<string, Array<{ template_id: number; property_name: string; is_required: boolean }>> = {};

    result.rows.forEach((row) => {
      if (!grouped[row.template_name]) {
        grouped[row.template_name] = [];
      }
      // LEFT JOIN으로 인해 속성이 없는(empty) 템플릿은 property_name이 null입니다
      if (row.property_name) {
        grouped[row.template_name].push({
          template_id: row.template_id,
          property_name: row.property_name,
          is_required: row.is_required,
        });
      }
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
    const { template_name, property_name, is_required } = body;

    if (!template_name || !property_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // $1, $2, $3를 사용하여 SQL 인젝션 방지 및 Insert 수행
    const result = await query(
      `INSERT INTO templates (template_name, property_name, is_required)
       VALUES ($1, $2, $3)
       RETURNING id, template_name, property_name, is_required`,
      [template_name, property_name, Boolean(is_required)]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('POST /api/templates error:', error);
    // PostgreSQL 23505 에러: UNIQUE 제약조건 위반 (동일한 속성이 이미 존재함)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Property name already exists for this template' }, { status: 409 });
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