const { Op } = require('sequelize');
const Author = require('../models/Author');
const AuthorFollow = require('../models/AuthorFollow');
const Book = require('../models/Book');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// Helper: extract Cloudinary publicId from URL
const extractPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    const withExt = parts.slice(uploadIndex + 2).join('/');
    return withExt.substring(0, withExt.lastIndexOf('.'));
  } catch {
    return null;
  }
};

/**
 * GET /authors
 * Public — list all authors with optional search & pagination
 */
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 12, search } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const whereClause = {};
    if (search) {
      whereClause.penName = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Author.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      attributes: {
        include: [
          [
            Author.sequelize.literal(
              `(SELECT COUNT(*) FROM author_follows WHERE author_follows.author_id = Author.id)`
            ),
            'followerCount'
          ],
          [
            Author.sequelize.literal(
              `(SELECT COUNT(*) FROM books WHERE books.author_id = Author.id)`
            ),
            'bookCount'
          ]
        ]
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /authors/:id
 * Public — get single author with books and follower count
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await Author.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'avatarUrl'] },
      ],
      attributes: {
        include: [
          [
            Author.sequelize.literal(
              `(SELECT COUNT(*) FROM author_follows WHERE author_follows.author_id = \`Author\`.\`id\`)`
            ),
            'followerCount'
          ]
        ]
      }
    });

    if (!author) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tác giả' });
    }

    // Fetch books separately to avoid circular dependency (Book ↔ Author)
    const books = await Book.findAll({
      where: { authorId: id },
      attributes: ['id', 'title', 'slug', 'coverImageUrl', 'status', 'totalViews', 'avgRating', 'totalChapters'],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    res.json({ success: true, data: { ...author.toJSON(), books } });
  } catch (error) {
    console.error('Error fetching author:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /authors
 * Admin only — create new author, optionally upload avatar
 */
const create = async (req, res) => {
  try {
    const { penName, bio, country, userId } = req.body;

    if (!penName || !penName.trim()) {
      return res.status(400).json({ success: false, message: 'Tên bút danh là bắt buộc' });
    }

    const avatarUrl = req.file ? req.file.path : null;

    const author = await Author.create({
      penName: penName.trim(),
      bio: bio || null,
      avatarUrl,
      country: country || null,
      userId: userId || null
    });

    res.status(201).json({ success: true, data: author });
  } catch (error) {
    console.error('Error creating author:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /authors/:id
 * Admin only — update author info, optionally replace avatar
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { penName, bio, country, userId } = req.body;

    const author = await Author.findByPk(id);
    if (!author) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tác giả' });
    }

    let avatarUrl = author.avatarUrl;

    if (req.file) {
      // Delete old avatar from Cloudinary
      if (author.avatarUrl) {
        const oldPublicId = extractPublicId(author.avatarUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId).catch(console.error);
        }
      }
      avatarUrl = req.file.path;
    }

    await author.update({
      penName: penName ? penName.trim() : author.penName,
      bio: bio !== undefined ? bio : author.bio,
      country: country !== undefined ? country : author.country,
      userId: userId !== undefined ? (userId || null) : author.userId,
      avatarUrl
    });

    res.json({ success: true, message: 'Cập nhật tác giả thành công', data: author });
  } catch (error) {
    console.error('Error updating author:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /authors/:id
 * Admin only — delete author (only if no books linked)
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await Author.findByPk(id);
    if (!author) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tác giả' });
    }

    // Check if author has books
    const bookCount = await Book.count({ where: { authorId: id } });
    if (bookCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Không thể xóa! Tác giả này đang có ${bookCount} cuốn sách liên kết.`
      });
    }

    // Delete avatar from Cloudinary if exists
    if (author.avatarUrl) {
      const publicId = extractPublicId(author.avatarUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(console.error);
    }

    await author.destroy();
    res.json({ success: true, message: 'Đã xóa tác giả thành công' });
  } catch (error) {
    console.error('Error deleting author:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /authors/:id/follow
 * Authenticated user — toggle follow/unfollow
 */
const toggleFollow = async (req, res) => {
  try {
    const { id: authorId } = req.params;
    const userId = req.user.id;

    const author = await Author.findByPk(authorId);
    if (!author) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tác giả' });
    }

    const existing = await AuthorFollow.findOne({ where: { userId, authorId } });

    if (existing) {
      await existing.destroy();
      return res.json({ success: true, followed: false, message: 'Đã hủy theo dõi' });
    } else {
      await AuthorFollow.create({ userId, authorId });
      return res.json({ success: true, followed: true, message: 'Đã theo dõi tác giả' });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /authors/:id/follow
 * Authenticated user — check if following this author
 */
const getFollowStatus = async (req, res) => {
  try {
    const { id: authorId } = req.params;
    const userId = req.user.id;

    const existing = await AuthorFollow.findOne({ where: { userId, authorId } });
    // Return `isFollowing` to match frontend expectation
    res.json({ success: true, data: { isFollowing: !!existing } });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update, remove, toggleFollow, getFollowStatus };
