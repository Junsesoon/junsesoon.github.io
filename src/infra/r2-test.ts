import 'dotenv/config';
import { HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from './r2';

async function testR2Connection() {
  try {
    console.log(`🛠️  R2 스토리지 연결을 시도합니다... (버킷: ${R2_BUCKET_NAME})`);

    // 1. 버킷 접근 권한 및 연결 확인
    const headCommand = new HeadBucketCommand({
      Bucket: R2_BUCKET_NAME,
    });
    await r2Client.send(headCommand);
    console.log(`✅ R2 버킷(${R2_BUCKET_NAME}) 연결 및 접근 권한 확인 완료!`);

    // 2. 버킷 내 파일 목록(최대 5개) 조회 테스트
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 5,
    });
    const listRes = await r2Client.send(listCommand);
    
    console.log(`\n📂 현재 버킷에 있는 파일 목록 (최대 5개 조회):`);
    if (listRes.Contents && listRes.Contents.length > 0) {
      listRes.Contents.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.Key} (${item.Size} bytes)`);
      });
    } else {
      console.log(`  (버킷이 비어있거나 파일을 찾을 수 없습니다.)`);
    }
    
    console.log(`\n🎉 모든 R2 테스트가 성공적으로 완료되었습니다.`);
  } catch (error) {
    console.error(`❌ R2 연결 실패:`, error);
  }
}

testR2Connection();