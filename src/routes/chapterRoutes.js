const express = require('express');
const router = express.Router();
const { getChaptersByBook, createChapter } = require('../controllers/chapterController');
const { uploadCloudPdf } = require('../config/cloudinary');

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
router.post('/', uploadCloudPdf.single('file_pdf'), createChapter);

module.exports = router;
