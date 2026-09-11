const express = require('express');
const router = express.Router();
const { getAllBooks, createBook, getBookBySlug, updateBook, deleteBook, searchBooks } = require('../controllers/bookController');
const { uploadCloudImage } = require('../config/cloudinary');

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management APIs
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: List of books
 */
router.get('/', getAllBooks);

// IMPORTANT: /search phải trước /:slug để Express không nhầm "search" là slug
router.get('/search', searchBooks);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book with cover image
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Book created successfully
 */
router.post('/', uploadCloudImage.single('coverImage'), createBook);

/**
 * @swagger
 * /books/{slug}:
 *   get:
 *     summary: Get book by slug
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book details
 */
router.get('/:slug', getBookBySlug);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update book by id
 *     tags: [Books]
 */
router.put('/:id', uploadCloudImage.single('coverImage'), updateBook);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete book by id
 *     tags: [Books]
 */
router.delete('/:id', deleteBook);

module.exports = router;
