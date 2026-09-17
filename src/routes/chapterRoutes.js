const express = require('express');
const router = express.Router();
const { getChaptersByBook, createChapter, getAllChapters, updateChapter, deleteChapter } = require('../controllers/chapterController');
const { uploadTempFile } = require('../config/cloudinary');

/**
 * @swagger
 * tags:
 *   name: Chapters
 *   description: API quản lý chương truyện
 */

/**
 * @swagger
 * /chapters/book/{bookId}:
 *   get:
 *     summary: Lấy danh sách tất cả các chương của một cuốn sách
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của cuốn sách
 *     responses:
 *       200:
 *         description: Danh sách chương
 */
router.get('/book/:bookId', getChaptersByBook);

/**
 * @swagger
 * /chapters:
 *   post:
 *     summary: Tạo một chương mới (Có hỗ trợ tải file PDF)
 *     tags: [Chapters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bookId:
 *                 type: integer
 *               chapterNumber:
 *                 type: integer
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *                 description: Nội dung dạng chữ (nếu không dùng PDF)
 *               isVip:
 *                 type: boolean
 *               priceCoin:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [draft, published, hidden]
 *               file_pdf:
 *                 type: string
 *                 format: binary
 *                 description: File PDF tải lên (tùy chọn)
 *     responses:
 *       201:
 *         description: Tạo chương thành công
 */
router.post('/', uploadTempFile.fields([
  { name: 'file_pdf', maxCount: 1 }, 
  { name: 'file_pdf_en', maxCount: 1 },
  { name: 'file_epub', maxCount: 1 },
  { name: 'file_epub_en', maxCount: 1 }
]), createChapter);

/**
 * @swagger
 * /chapters:
 *   get:
 *     summary: Lấy danh sách tất cả chương (Admin)
 *     tags: [Chapters]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', getAllChapters);

/**
 * @swagger
 * /chapters/{id}:
 *   put:
 *     summary: Cập nhật thông tin chương
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/:id', uploadTempFile.fields([
  { name: 'file_pdf', maxCount: 1 }, 
  { name: 'file_pdf_en', maxCount: 1 },
  { name: 'file_epub', maxCount: 1 },
  { name: 'file_epub_en', maxCount: 1 }
]), updateChapter);

/**
 * @swagger
 * /chapters/{id}:
 *   delete:
 *     summary: Xóa chương
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:id', deleteChapter);

module.exports = router;
