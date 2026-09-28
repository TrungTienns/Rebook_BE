const express = require('express');
const router = express.Router();
const {
  getAll, getById, create, update, remove, toggleFollow, getFollowStatus
} = require('../controllers/authorController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadCloudImage } = require('../config/cloudinary');

/**
 * @swagger
 * tags:
 *   name: Authors
 *   description: Author management and follow APIs
 */

/**
 * @swagger
 * /authors:
 *   get:
 *     summary: Get all authors (with optional search & pagination)
 *     tags: [Authors]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: List of authors
 */
router.get('/', getAll);

/**
 * @swagger
 * /authors/{id}:
 *   get:
 *     summary: Get author by ID (includes books + follower count)
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Author detail
 *       404:
 *         description: Not found
 */
router.get('/:id', getById);

/**
 * @swagger
 * /authors/{id}/follow:
 *   get:
 *     summary: Check if the current user follows this author
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/follow', protect, getFollowStatus);

/**
 * @swagger
 * /authors:
 *   post:
 *     summary: Create a new author (Admin only)
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, admin, uploadCloudImage.single('avatar'), create);

/**
 * @swagger
 * /authors/{id}/follow:
 *   post:
 *     summary: Toggle follow/unfollow an author (Authenticated user)
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/follow', protect, toggleFollow);

/**
 * @swagger
 * /authors/{id}:
 *   put:
 *     summary: Update author (Admin only)
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', protect, admin, uploadCloudImage.single('avatar'), update);

/**
 * @swagger
 * /authors/{id}:
 *   delete:
 *     summary: Delete author (Admin only, fails if author has books)
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, admin, remove);

module.exports = router;
