'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminHeader } from '../../../components/AdminHeader';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { DataTable } from '../../../components/DataTable';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { ImageUpload } from '../../../components/ImageUpload';
import { LanguageTabs } from '../../../components/LanguageTabs';
import { BlogPost, BlogPostInput } from '../../../types/blog';

const ALL_LANG_CODES = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];

interface PostFormData {
  id?: string;
  slug: string;
  coverImage: string;
  tags: string[];
  author: string;
  date: string;
  readTime: string;
  published: boolean;
  content: Record<string, { title: string; excerpt: string; content: string }>;
}

const emptyContent = (): Record<string, { title: string; excerpt: string; content: string }> => {
  return ALL_LANG_CODES.reduce((acc, lang) => {
    acc[lang] = { title: '', excerpt: '', content: '' };
    return acc;
  }, {} as Record<string, { title: string; excerpt: string; content: string }>);
};

const emptyFormData = (): PostFormData => ({
  slug: '',
  coverImage: '',
  tags: [],
  author: 'Admin',
  date: new Date().toISOString().split('T')[0],
  readTime: '5 min',
  published: false,
  content: emptyContent(),
});

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostFormData>(emptyFormData());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      setPosts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content['en']?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && post.published) ||
      (statusFilter === 'draft' && !post.published);
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingPost(emptyFormData());
    setTagInput('');
    setActiveLang('zh');
    setIsModalOpen(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost({
      id: post.id,
      slug: post.slug,
      coverImage: post.coverImage,
      tags: post.tags,
      author: post.author,
      date: post.date,
      readTime: post.readTime,
      published: post.published,
      content: ALL_LANG_CODES.reduce((acc, lang) => {
        acc[lang] = post.content[lang] || { title: '', excerpt: '', content: '' };
        return acc;
      }, {} as Record<string, { title: string; excerpt: string; content: string }>),
    });
    setTagInput('');
    setActiveLang('zh');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingPost.id ? 'PUT' : 'POST';
      const url = editingPost.id ? `/api/blog/${editingPost.id}` : '/api/blog';

      const payload: BlogPostInput = {
        slug: editingPost.slug,
        coverImage: editingPost.coverImage,
        tags: editingPost.tags,
        author: editingPost.author,
        date: editingPost.date,
        readTime: editingPost.readTime,
        published: editingPost.published,
        content: editingPost.content,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');

      await fetchPosts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/blog/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchPosts();
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('将从JSON备份文件恢复所有文章数据到数据库。是否继续？')) return;
    setRestoring(true);
    try {
      const res = await fetch('/api/import-blog', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`恢复成功：已导入 ${data.imported} 篇文章，跳过 ${data.skipped} 个已存在的记录`);
        await fetchPosts();
      } else {
        alert('恢复失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Failed to restore posts:', error);
      alert('恢复失败');
    } finally {
      setRestoring(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !editingPost.tags.includes(tag)) {
      setEditingPost({ ...editingPost, tags: [...editingPost.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setEditingPost({ ...editingPost, tags: editingPost.tags.filter((t) => t !== tag) });
  };

  const handleTranslate = async () => {
    if (!editingPost.content[activeLang]?.title) {
      alert('请先填写当前语言的文章标题');
      return;
    }

    setTranslating(true);
    try {
      const targetLangs = ALL_LANG_CODES.filter(lang => lang !== activeLang);

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog',
          sourceLang: activeLang,
          targetLangs,
          content: editingPost.content,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingPost({
          ...editingPost,
          content: data.data,
        });
      } else {
        alert('翻译失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('翻译失败');
    } finally {
      setTranslating(false);
    }
  };

  const columns = [
    {
      key: 'coverImage',
      header: '封面',
      render: (post: BlogPost) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
          {post.coverImage ? (
            <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      header: 'ID',
      render: (post: BlogPost) => (
        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{post.id}</span>
      ),
    },
    {
      key: 'title',
      header: '标题',
      render: (post: BlogPost) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{post.content['en']?.title || '未命名'}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{post.content['en']?.excerpt || ''}</p>
        </div>
      ),
    },
    {
      key: 'tags',
      header: '标签',
      render: (post: BlogPost) => (
        <div className="flex flex-wrap gap-1">
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">
              {tag}
            </span>
          ))}
          {post.tags.length > 2 && (
            <span className="px-2 py-0.5 text-xs text-slate-500">+{post.tags.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: '日期',
      render: (post: BlogPost) => (
        <span className="text-sm text-slate-500 dark:text-slate-400">{post.date}</span>
      ),
    },
    {
      key: 'published',
      header: '状态',
      render: (post: BlogPost) => (
        <StatusBadge status={post.published ? 'published' : 'draft'} />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (post: BlogPost) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(post)}>
            编辑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDeleteModal(post.id)} className="text-red-500 hover:text-red-600">
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="博客管理" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'published', label: '已发布' },
                { value: 'draft', label: '草稿' },
              ]}
            />
          </div>
          <Button onClick={openCreateModal}>+ 新增文章</Button>
            <Button variant="secondary" onClick={handleRestore} loading={restoring}>
              从备份恢复
            </Button>
        </div>

        <DataTable columns={columns} data={filteredPosts} loading={loading} />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPost.id ? '编辑文章' : '创建文章'}
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="文章ID"
                value={editingPost.id || ''}
                disabled
                placeholder="自动生成"
              />
              <Input
                label="Slug"
                value={editingPost.slug}
                onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                placeholder="例如：product-launch-2024"
              />
            </div>

            <ImageUpload
              label="封面图片"
              value={editingPost.coverImage}
              onChange={(url) => setEditingPost({ ...editingPost, coverImage: url })}
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="作者"
                value={editingPost.author}
                onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })}
              />
              <Input
                label="日期"
                type="date"
                value={editingPost.date}
                onChange={(e) => setEditingPost({ ...editingPost, date: e.target.value })}
              />
              <Input
                label="阅读时间"
                value={editingPost.readTime}
                onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                placeholder="5 分钟"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                标签
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editingPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#0066ff]/10 text-[#0066ff] rounded-full text-sm"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="添加标签"
                  className="flex-1"
                />
                <Button variant="secondary" onClick={addTag}>添加</Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                发布状态
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPost.published}
                  onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0066ff]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066ff]"></div>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  多语言内容
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTranslate}
                  disabled={translating || !editingPost.content[activeLang]?.title}
                >
                  {translating ? '翻译中...' : '🌐 翻译到其他语言'}
                </Button>
              </div>
              <LanguageTabs
                languages={ALL_LANG_CODES}
                activeLanguage={activeLang}
                onLanguageChange={setActiveLang}
              />
              <div className="mt-4 space-y-4">
                <Input
                  label="标题"
                  value={editingPost.content[activeLang]?.title || ''}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      content: {
                        ...editingPost.content,
                        [activeLang]: {
                          ...editingPost.content[activeLang],
                          title: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="输入文章标题"
                />
                <Input
                  label="摘要"
                  value={editingPost.content[activeLang]?.excerpt || ''}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      content: {
                        ...editingPost.content,
                        [activeLang]: {
                          ...editingPost.content[activeLang],
                          excerpt: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="简短描述"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    内容 (Markdown)
                  </label>
                  <textarea
                    value={editingPost.content[activeLang]?.content || ''}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        content: {
                          ...editingPost.content,
                          [activeLang]: {
                            ...editingPost.content[activeLang],
                            content: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="使用 Markdown 编写文章内容..."
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-colors font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editingPost.id ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="删除文章"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              确定要删除这篇文章吗？此操作无法撤销。
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={saving}>
                删除
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
