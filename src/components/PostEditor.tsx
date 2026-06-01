'use client';

import React, { useState, useRef } from 'react';

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
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

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

      // Extract image URLs from markdown content
      const extractImageUrls = (text: string) => {
        const regex = /!\[.*?\]\((.*?)\)/g;
        const urls: string[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          urls.push(match[1]);
        }
        return urls;
      };

      const initialUrls = extractImageUrls(initialData?.content || '');
      const finalUrls = extractImageUrls(formData.content);
      const allPossibleUrls = new Set([...initialUrls, ...uploadedImages]);
      const deletedUrls = Array.from(allPossibleUrls).filter((url) => !finalUrls.includes(url));

      if (deletedUrls.length > 0) {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: deletedUrls }),
        }).catch((err) => console.error('Failed to delete orphaned images:', err));
      }

      await onSave({
        ...formData,
        tags: parsedTags,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      setUploadedImages((prev) => [...prev, data.url]);
      insertAtCursor(`![${file.name}](${data.url})`);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const file = e.clipboardData.files?.[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      await uploadImage(file);
    }
  };

  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;

    const newContent = currentContent.substring(0, start) + textToInsert + currentContent.substring(end);
    
    setFormData((prev) => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      textarea.focus();
    }, 0);
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
          ref={textareaRef}
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onPaste={handlePaste}
          required
          readOnly={isUploading}
          rows={15}
          className={`block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isUploading ? 'bg-gray-50' : ''}`}
          placeholder={isUploading ? 'Uploading image...' : 'Write your markdown content here. Drag & drop or paste (Ctrl+V) images to upload.'}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className={`inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            (isSubmitting || isUploading) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Saving...' : isUploading ? 'Uploading Image...' : 'Save Post'}
        </button>
      </div>
    </form>
  );
}