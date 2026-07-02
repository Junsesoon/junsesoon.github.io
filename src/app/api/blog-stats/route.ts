import { NextResponse } from 'next/server';
import { query as tursoQuery } from '../../../infra/turso';
import { getAllPosts } from '../../../utils/posts';

export const dynamic = 'force-dynamic'; // Prevent static generation attempts on build

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // 1. Fetch posts and apply category filtering if provided
    const posts = await getAllPosts('blog');
    const filteredPosts = category
      ? posts.filter((post) => {
          const target = category.toLowerCase();
          const matchCategory = (cat: string | string[] | undefined | null) => {
            if (!cat) return false;
            if (Array.isArray(cat)) {
              return cat.some(c => c.toLowerCase() === target);
            }
            return cat.toLowerCase() === target;
          };
          return (
            matchCategory(post.category1) ||
            matchCategory(post.category2) ||
            matchCategory(post.metadata?.category3) ||
            matchCategory(post.metadata?.category4)
          );
        })
      : posts;

    const totalPosts = filteredPosts.length;
    const totalLikes = filteredPosts.reduce((sum: number, post: any) => sum + (Number(post.likes_count) || 0), 0);
    const totalVisitors = filteredPosts.reduce((sum: number, post: any) => sum + (Number(post.views_count) || 0), 0);

    // 2. Query Turso database for visitor metrics in KST time
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayString = kstNow.toISOString().split('T')[0];

    let totalUniqueVisitors = 0;
    let todayVisitors = 0;

    // Total unique visitors
    const statsResult = await tursoQuery("SELECT stat_value FROM site_stats WHERE stat_key = 'total_visitors'");
    if (statsResult.rows && statsResult.rows.length > 0) {
      totalUniqueVisitors = Number(statsResult.rows[0].stat_value);
    }

    // Today's visitors count
    const todayResult = await tursoQuery(
      "SELECT COUNT(DISTINCT session_id) as today_count FROM visitors_manage WHERE visited_date = ?",
      [todayString]
    );
    if (todayResult.rows && todayResult.rows.length > 0) {
      todayVisitors = Number(todayResult.rows[0].today_count);
    }

    // Return the response with edge CDN caching headers (5 minutes cache)
    return new Response(
      JSON.stringify({
        success: true,
        totalPosts,
        totalLikes,
        totalVisitors,
        totalUniqueVisitors,
        todayVisitors,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=59',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to aggregate blog statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
