export interface Post {
  post_id?: string;
  likes_count?: number;
  views_count?: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category1?: string | string[];
  category2?: string | string[];
  metadata?: any;
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

export interface FrontMatter {
  title: string;
  parentId: string | null;
  startDate?: string | null;
  endDate?: string | null;
  posted_at?: string | null;
  modified_at?: string | null;
  project?: string | null;
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
  category4?: string | null;
  summary?: string;
  tags?: string[];
  docVer?: string | null;
  completion?: boolean;
  techStart?: string | null;
  parentSkill?: string[];
  childSkill?: string[];
  familiar?: number | null;
  contribute?: string | null;
  role?: string | null;
  platform?: string | null;
  language?: string | null;
  server?: string | null;
  framework?: string | null;
  db?: string | null;
  ide?: string | null;
  api?: string | null;
  library?: string | null;
  [key: string]: unknown;
}

export interface DbPost {
  post_id?: string;
  likes_count?: number;
  views_count?: number;
  slug: string;
  content: string;
  metadata: FrontMatter;
}

export interface DbPostRow {
  slug: string;
  content: string;
  title: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  summary: string | null;
  tags: string[] | null;
  project_name: string | null;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  category4: string | null;
  doc_ver: string | null;
  completion: boolean | null;
  tech_start: Date | string | null;
  parent_skill: string | null;
  child_skill: string | null;
  familiar: number | null;
  contribute: string | null;
  my_role: string | null;
  tech_platform: string | null;
  tech_language: string | null;
  tech_server: string | null;
  tech_framework: string | null;
  tech_db: string | null;
  tech_ide: string | null;
  tech_api: string | null;
  tech_library: string | null;
}