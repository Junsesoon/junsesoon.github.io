import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '../../../infra/r2';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert the incoming file into a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 로컬 파일명 노출을 막기 위해 확장자만 추출하고 고유 식별자를 사용합니다
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const prefix = process.env.NODE_ENV === 'development' ? 'dev-images/' : 'prod-images/';
    const objectKey = `${prefix}${Date.now()}_${crypto.randomUUID()}.${extension}`;

    // Upload to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    const imageUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${objectKey}` : `/${objectKey}`;
    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided for deletion' }, { status: 400 });
    }

    const deletePromises = urls.map(async (url: string) => {
      // URL에서 R2 Object Key 추출 (예: https://cdn.domain.com/prefix/filename.png -> prefix/filename.png)
      let objectKey = url;
      if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
        objectKey = url.replace(`${R2_PUBLIC_URL}/`, '');
      } else if (url.startsWith('/')) {
        objectKey = url.substring(1);
      }

      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
      });

      return r2Client.send(command);
    });

    await Promise.all(deletePromises);
    return NextResponse.json({ message: 'Images deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
  }
}