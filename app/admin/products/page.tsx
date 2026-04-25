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
import { ParameterTable, SpecItem } from '../../../components/ParameterTable';
import { Product, ProductInput } from '../../../types/product';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'fa', label: 'فارسی' },
  { code: 'la', label: 'Latina' },
];

const ALL_LANG_CODES = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];

interface ProductFormData {
  id?: string;
  slug: string;
  image: string;
  specs: Record<string, SpecItem[]>;
  published: boolean;
  content: Record<string, { name: string; description: string }>;
}

const emptyContent = (): Record<string, { name: string; description: string }> => {
  return ALL_LANG_CODES.reduce((acc, lang) => {
    acc[lang] = { name: '', description: '' };
    return acc;
  }, {} as Record<string, { name: string; description: string }>);
};

const emptyFormData = (): ProductFormData => ({
  slug: '',
  image: '',
  specs: ALL_LANG_CODES.reduce((acc, lang) => {
    acc[lang] = [];
    return acc;
  }, {} as Record<string, SpecItem[]>),
  published: false,
  content: emptyContent(),
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData>(emptyFormData());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState('en');
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.content['en']?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && product.published) ||
      (statusFilter === 'draft' && !product.published);
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingProduct(emptyFormData());
    setActiveLang('zh');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    // Convert old array format specs to new per-language format
    const convertSpecs = (specs: Record<string, SpecItem[]> | SpecItem[]): Record<string, SpecItem[]> => {
      if (Array.isArray(specs)) {
        // Old format: specs is an array - use as source for English
        const enSpecs = specs;
        const result: Record<string, SpecItem[]> = { en: enSpecs };
        // Initialize other languages with empty arrays (will be translated later)
        ALL_LANG_CODES.filter(l => l !== 'en').forEach(lang => {
          result[lang] = [];
        });
        return result;
      }
      return specs;
    };

    setEditingProduct({
      id: product.id,
      slug: product.slug,
      image: product.image,
      specs: convertSpecs(product.specs),
      published: product.published,
      content: ALL_LANG_CODES.reduce((acc, lang) => {
        acc[lang] = product.content[lang] || { name: '', description: '' };
        return acc;
      }, {} as Record<string, { name: string; description: string }>),
    });
    setActiveLang('zh');
    setIsModalOpen(true);
  };

  const handleTranslate = async () => {
    if (!editingProduct.content[activeLang]?.name) {
      alert('请先填写' + LOCALES.find(l => l.code === activeLang)?.label + '的产品名称');
      return;
    }

    setTranslating(true);
    try {
      const targetLangs = ALL_LANG_CODES.filter(lang => lang !== activeLang);

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          sourceLang: activeLang,
          targetLangs,
          content: editingProduct.content,
          specs: editingProduct.specs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingProduct({
          ...editingProduct,
          content: data.data.content,
          specs: data.data.specs,
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

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImporting(true);
    setImportResult(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setImportResult({ success: false, message: '请选择文件' });
      setImporting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import-products-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setImportResult({
          success: true,
          message: `导入成功：${data.imported} 个产品已导入，${data.skipped} 个已跳过`,
        });
        await fetchProducts();
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportResult(null);
        }, 2000);
      } else {
        setImportResult({ success: false, message: data.error || '导入失败' });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({ success: false, message: '导入失败' });
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingProduct.id ? 'PUT' : 'POST';
      const url = editingProduct.id ? `/api/products/${editingProduct.id}` : '/api/products';

      const payload: ProductInput = {
        slug: editingProduct.slug,
        image: editingProduct.image,
        specs: editingProduct.specs,
        published: editingProduct.published,
        content: editingProduct.content,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');

      await fetchProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchProducts();
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const columns = [
    {
      key: 'image',
      header: '图片',
      render: (product: Product) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
          {product.image ? (
            <img src={product.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      header: 'ID',
      render: (product: Product) => (
        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{product.id}</span>
      ),
    },
    {
      key: 'name',
      header: '名称',
      render: (product: Product) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{product.content['en']?.name || '未命名'}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{product.content['en']?.description || ''}</p>
        </div>
      ),
    },
    {
      key: 'specs',
      header: '参数',
      render: (product: Product) => (
        <span className="text-sm text-slate-500 dark:text-slate-400">{(product.specs['en'] || []).length} 个参数</span>
      ),
    },
    {
      key: 'published',
      header: '状态',
      render: (product: Product) => (
        <StatusBadge status={product.published ? 'published' : 'draft'} />
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(product)}>
            编辑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openDeleteModal(product.id)} className="text-red-500 hover:text-red-600">
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="产品管理" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="搜索产品..."
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
          <Button onClick={openCreateModal}>+ 新增产品</Button>
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            导入Excel
          </Button>
        </div>

        <DataTable columns={columns} data={filteredProducts} loading={loading} />

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct.id ? '编辑产品' : '创建产品'}
          size="xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="产品ID"
                value={editingProduct.id || ''}
                disabled
                placeholder="自动生成"
              />
              <Input
                label="Slug"
                value={editingProduct.slug}
                onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                placeholder="例如：pa-3arg"
              />
            </div>

            <ImageUpload
              label="产品图片"
              value={editingProduct.image}
              onChange={(url) => setEditingProduct({ ...editingProduct, image: url })}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                发布状态
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.published}
                  onChange={(e) => setEditingProduct({ ...editingProduct, published: e.target.checked })}
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
                  disabled={translating || !editingProduct.content[activeLang]?.name}
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
                  label="产品名称"
                  value={editingProduct.content[activeLang]?.name || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      content: {
                        ...editingProduct.content,
                        [activeLang]: {
                          ...editingProduct.content[activeLang],
                          name: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="输入产品名称"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    描述
                  </label>
                  <textarea
                    value={editingProduct.content[activeLang]?.description || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        content: {
                          ...editingProduct.content,
                          [activeLang]: {
                            ...editingProduct.content[activeLang],
                            description: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="输入产品描述"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-colors"
                  />
                </div>
              </div>
            </div>

            <ParameterTable
              specs={editingProduct.specs[activeLang] || []}
              onChange={(specs) => setEditingProduct({
                ...editingProduct,
                specs: { ...editingProduct.specs, [activeLang]: specs }
              })}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editingProduct.id ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="删除产品"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
              确定要删除这个产品吗？此操作无法撤销。
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

        {/* Import Excel Modal */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => { setIsImportModalOpen(false); setImportResult(null); }}
          title="导入产品"
          size="md"
        >
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                请下载模板文件，填写后上传：{' '}
                <a
                  href="/docs/product_model.xlsx"
                  download
                  className="text-[#0066ff] hover:underline"
                >
                  product_model.xlsx
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                选择 Excel 文件
              </label>
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[#0066ff] file:text-white hover:file:bg-[#0052cc]"
              />
            </div>

            {importResult && (
              <div
                className={`p-3 rounded-lg ${importResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}
              >
                {importResult.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="secondary" type="button" onClick={() => setIsImportModalOpen(false)}>
                取消
              </Button>
              <Button type="submit" loading={importing}>
                导入
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
