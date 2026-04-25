const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const projectRoot = path.resolve(__dirname, '..');

// Create workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Products
const productsData = [
  // Header row
  ['slug', 'name_en', 'name_zh', 'name_ru', 'name_ar', 'name_fa', 'name_la',
   'desc_en', 'desc_zh', 'desc_ru', 'desc_ar', 'desc_fa', 'desc_la',
   'image', 'published'],
  // Example row
  ['pa-example', 'Example Product', '示例产品', 'Пример продукта', 'منتج مثال', 'نمونه محصول', 'Exemplum',
   'This is an example product description.', '这是示例产品描述。', 'Это пример описания продукта.', 'هذا وصف مثال المنتج', 'این یک توضیح محصول نمونه است', 'Hoc est exemplum descriptionis producti',
   'https://example.com/image.jpg', 'yes'],
  // Empty row for user to fill
  ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
];

const productsSheet = XLSX.utils.aoa_to_sheet(productsData);

// Set column widths for Products sheet
productsSheet['!cols'] = [
  { wch: 15 }, // slug
  { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, // names
  { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, // descriptions
  { wch: 40 }, // image
  { wch: 10 }, // published
];

XLSX.utils.book_append_sheet(wb, productsSheet, 'Products');

// Sheet 2: Specs
const specsData = [
  // Header row
  ['slug', 'spec_name', 'spec_value', 'spec_unit'],
  // Example rows
  ['pa-example', 'Accuracy', '0.1', 'deg'],
  ['pa-example', 'Range', '100', 'm'],
  ['pa-example', 'Weight', '50', 'g'],
  // Empty row for user to fill
  ['', '', '', ''],
];

const specsSheet = XLSX.utils.aoa_to_sheet(specsData);

// Set column widths for Specs sheet
specsSheet['!cols'] = [
  { wch: 15 }, // slug
  { wch: 20 }, // spec_name
  { wch: 15 }, // spec_value
  { wch: 10 }, // spec_unit
];

XLSX.utils.book_append_sheet(wb, specsSheet, 'Specs');

// Sheet 3: Instructions
const instructionsData = [
  ['产品导入模板说明'],
  [''],
  ['一、文件说明'],
  ['本模板用于批量导入产品信息到后台管理系统。'],
  [''],
  ['二、Sheet 说明'],
  ['• Products 表：填写产品基本信息'],
  ['• Specs 表：填写产品技术参数'],
  [''],
  ['三、Products 表字段说明'],
  ['字段名', '说明', '是否必填'],
  ['slug', '产品唯一标识，如：pa-3arg', '必填'],
  ['name_en', '产品英文名称', '至少填一种语言'],
  ['name_zh', '产品中文名称', '至少填一种语言'],
  ['name_ru', '产品俄文名称', '可选'],
  ['name_ar', '产品阿拉伯文名称', '可选'],
  ['name_fa', '产品波斯文名称', '可选'],
  ['name_la', '产品拉丁文名称', '可选'],
  ['desc_en', '产品英文描述', '至少填一种语言'],
  ['desc_zh', '产品中文描述', '至少填一种语言'],
  ['desc_ru', '产品俄文描述', '可选'],
  ['desc_ar', '产品阿拉伯文描述', '可选'],
  ['desc_fa', '产品波斯文描述', '可选'],
  ['desc_la', '产品拉丁文描述', '可选'],
  ['image', '产品图片URL地址', '可选'],
  ['published', '是否发布：yes 或 no', '必填'],
  [''],
  ['四、Specs 表字段说明'],
  ['字段名', '说明', '是否必填'],
  ['slug', '产品标识，需与 Products 表对应', '必填'],
  ['spec_name', '参数名称，如：Accuracy', '必填'],
  ['spec_value', '参数值，如：0.1', '必填'],
  ['spec_unit', '参数单位，如：deg', '可选'],
  [''],
  ['五、注意事项'],
  ['1. slug 必须唯一，不能重复'],
  ['2. 必填字段缺失的产品将跳过导入'],
  ['3. 导入后可使用"翻译到其他语言"按钮自动翻译'],
  ['4. 图片请使用完整的 URL 地址'],
];

const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
instructionsSheet['!cols'] = [
  { wch: 50 },
  { wch: 50 },
  { wch: 15 },
];

XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

// Save the file
const docsDir = path.join(projectRoot, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
const outputPath = path.join(docsDir, 'product_model.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Excel template created at:', outputPath);