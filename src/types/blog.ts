export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

// frontmatter를 포함한 게시물 내부 처리용 타입
export interface PostWithFrontmatter extends Post {
  category1?: string | string[];
  category2?: string | string[];
}

export interface PostFilterOptions {
  category1?: string;
  category2?: string;
}