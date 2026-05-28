'use client';

import React, { useState } from 'react';

export interface PostFormData {
  title: string;
  summary: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
  tags: string[];
  content: string;
}

export interface PostEditorProps {
  initialData?: Partial<PostFormData>;
  onSave: (formData: PostFormData) => Promise<void>;
}

export default function PostEditor({ initialData, onSave }: PostEditorProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    category1: initialData?.category1 || '',
    category2: initialData?.category2 || '',
    category3: initialData?.category3 || '',
    category4: initialData?.category4 || '',
    tags: initialData?.tags?.join(', ') || '',
    content: initialData?.content || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 태그는 쉼표로 구분된 문자열을 배열로 변환하고 양끝 공백을 제거
      const parsedTags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await onSave({
        ...formData,
        tags: parsedTags,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm font-sans">
      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Post Title"
        />
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-700">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          rows={2}
          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Brief summary of the post"
        />
      </div>

      {/* Categories (Grid Layout) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['category1', 'category2', 'category3', 'category4'].map((cat, index) => (
          <div key={cat}>
            <label htmlFor={cat} className="mb-2 block text-sm font-medium text-gray-700 capitalize">
              Category {index + 1}
            </label>
            <input
              type="text"
              id={cat}
              name={cat}
              value={formData[cat as keyof typeof formData] as string}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={`Category ${index + 1}`}
            />
          </div>
        ))}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="mb-2 block text-sm font-medium text-gray-700">
          Tags (comma separated)
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="nextjs, react, frontend"
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-700">
          Content (Markdown)
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows={15}
          className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Write your markdown content here..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Post'}
        </button>
      </div>
    </form>
  );
}