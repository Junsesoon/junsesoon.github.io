'use server';

import { query } from '../infra/neon';
import { revalidatePath } from 'next/cache';

export interface TimelineItem {
  id: number;
  name: string;
  color: string;
}

/**
 * Fetch all timeline items (Category 3 types and colors)
 */
export async function getTimelineItemsAction(): Promise<TimelineItem[]> {
  try {
    const result = await query(
      'SELECT timeline_item_id as id, item_name as name, bar_color as color FROM timeline_item_list ORDER BY timeline_item_id ASC'
    );
    return result.rows as TimelineItem[];
  } catch (error) {
    console.error('getTimelineItemsAction error:', error);
    return [];
  }
}

/**
 * Add a new timeline item
 */
export async function addTimelineItemAction(name: string, color: string) {
  if (!name || !name.trim() || !color || !color.trim()) {
    return { success: false, message: 'Item name and Bar color are required.' };
  }

  const cleanedName = name.trim().toLowerCase();

  try {
    const result = await query(
      `INSERT INTO timeline_item_list (item_name, bar_color)
       VALUES ($1, $2)
       RETURNING timeline_item_id as id, item_name as name, bar_color as color`,
      [cleanedName, color.trim()]
    );
    revalidatePath('/admin/about');
    revalidatePath('/about');
    return { success: true, item: result.rows[0] as TimelineItem };
  } catch (error: any) {
    console.error('addTimelineItemAction error:', error);
    if (error.code === '23505') { // PostgreSQL Unique Violation
      return { success: false, message: 'A timeline item with this name already exists.' };
    }
    return { success: false, message: 'Internal Server Error' };
  }
}

/**
 * Delete a timeline item
 */
export async function deleteTimelineItemAction(id: number) {
  if (!id) {
    return { success: false, message: 'Timeline Item ID is required.' };
  }

  try {
    await query('DELETE FROM timeline_item_list WHERE timeline_item_id = $1', [id]);
    revalidatePath('/admin/about');
    revalidatePath('/about');
    return { success: true };
  } catch (error: any) {
    console.error('deleteTimelineItemAction error:', error);
    return { success: false, message: 'Internal Server Error' };
  }
}

/**
 * Update an existing timeline item (e.g. to edit its name or color)
 */
export async function updateTimelineItemAction(id: number, name: string, color: string) {
  if (!id || !name || !name.trim() || !color || !color.trim()) {
    return { success: false, message: 'ID, Item name, and Bar color are required.' };
  }

  const cleanedName = name.trim().toLowerCase();

  try {
    await query(
      `UPDATE timeline_item_list
       SET item_name = $1, bar_color = $2, created_at = CURRENT_TIMESTAMP
       WHERE timeline_item_id = $3`,
      [cleanedName, color.trim(), id]
    );
    revalidatePath('/admin/about');
    revalidatePath('/about');
    return { success: true };
  } catch (error: any) {
    console.error('updateTimelineItemAction error:', error);
    if (error.code === '23505') { // PostgreSQL Unique Violation
      return { success: false, message: 'A timeline item with this name already exists.' };
    }
    return { success: false, message: 'Internal Server Error' };
  }
}
