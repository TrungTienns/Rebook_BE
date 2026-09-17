const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { uploadCloudImage } = require('../config/cloudinary');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API quản lý Phân loại sách
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lấy danh sách phân loại
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Danh sách phân loại
 */
router.get('/', getAllCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Tạo phân loại mới
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', uploadCloudImage.single('image'), createCategory);
router.put('/:id', uploadCloudImage.single('image'), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
