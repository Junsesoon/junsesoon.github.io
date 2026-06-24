import { MetadataRoute } from 'next';
// components 폴더의 readme에 명시된 DB 데이터 조회 유틸리티 경로를 활용합니다.
// (실제로 구현되어 있는 함수명, 예: getAllPosts 등에 맞게 수정해서 사용해 주세요)
import { getAllPosts } from '@/utils/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.incheon-people.com'; // 실제 운영하시는 도메인으로 변경해 주세요.

  // 1. 정적 라우트 설정 (메인 페이지, 스킬트리 등)
  const staticRoutes = ['', '/blog', '/cs', '/data', '/language', '/infra', '/tools', '/skilltree'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. 동적 라우트 설정 (DB에 저장된 블로그/포트폴리오 게시물 데이터 조회)
  const posts = await getAllPosts();

  // 3. GNB 메뉴(카테고리) 라우트 동적 생성
  // 게시물에서 사용된 category1을 중복 없이 추출하여 메뉴 URL(/trouble-shooting 등)로 매핑합니다.
  const uniqueCategories = Array.from(
    new Set(posts.map((post) => post.category1).filter(Boolean))
  ) as string[];

  const categoryRoutes = uniqueCategories.map((category) => {
    const categorySlug = category.toLowerCase().trim().replace(/\s+/g, '-');
    return {
      url: `${baseUrl}/${encodeURIComponent(categorySlug)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8, // 목록 페이지(GNB 메뉴)는 개별 글보다 우선순위가 높습니다.
    };
  });

  // 4. 개별 게시물 상세 라우트 설정
  const dynamicRoutes = posts.map((post: any) => {
    // app/(public)/[category]/[...id]/page.tsx 라우팅 구조에 맞게 URL을 매핑합니다.
    const categorySlug = post.category1 ? post.category1.toLowerCase().trim().replace(/\s+/g, '-') : 'blog';
    const encodedCategory = encodeURIComponent(categorySlug);
    const encodedSlug = post.slug.split('/').map(encodeURIComponent).join('/');
    return {
      url: `${baseUrl}/${encodedCategory}/${encodedSlug}`, 
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    };
  });

  return [...staticRoutes, ...categoryRoutes, ...dynamicRoutes];
}