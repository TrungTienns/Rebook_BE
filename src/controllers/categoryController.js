const Category = require('../models/Category');
const slugify = require('slugify');

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách phân loại' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên phân loại không được để trống' });
    }

    const slug = slugify(name, { lower: true, strict: true }) + '-' + Math.floor(Math.random() * 1000);
    
    const newCategory = await Category.create({ name, slug, description });
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Phân loại này đã tồn tại' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo phân loại' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy phân loại' });

    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    
    // Nếu đổi tên thì update slug
    if (name) {
      category.slug = slugify(name, { lower: true, strict: true }) + '-' + Math.floor(Math.random() * 1000);
    }
    
    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật phân loại' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy phân loại' });

    await category.destroy();
    res.json({ success: true, message: 'Đã xóa phân loại' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa phân loại' });
  }
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
