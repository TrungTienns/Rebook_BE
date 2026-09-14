const Comment = require('../models/Comment');
const User = require('../models/User');
const vnBadwords = require('@vnphu/vn-badwords');

const censorText = (text) => {
  if (!text) return text;
  const sortedBlackList = [...vnBadwords.blackList].sort((a, b) => b.length - a.length);
  let result = text;
  for (const badword of sortedBlackList) {
    if (!badword) continue;
    try {
      const regex = new RegExp(`(?<=^|\\s|\\W)(${badword})(?=$|\\s|\\W)`, 'gi');
      result = result.replace(regex, (match) => '*'.repeat(match.length));
    } catch (e) {
      // Ignore regex compilation errors for special characters
    }
  }
  return result;
};

/**
 * Tạo bình luận
 * POST /api/v1/comments
 * Body: { bookId, chapterId?, parentId?, content }
 * Auth: Required
 */
const createComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, chapterId, parentId, content } = req.body;

    if (!bookId || !content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'bookId và content là bắt buộc' });
    }

    // Nếu là reply, kiểm tra comment cha tồn tại
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Bình luận gốc không tồn tại' });
      }
    }

    const comment = await Comment.create({
      userId,
      bookId,
      chapterId: chapterId || null,
      parentId: parentId || null,
      content: censorText(content.trim())
    });

    // Trả về kèm user info
    const fullComment = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatarUrl']
      }]
    });

    res.status(201).json({ success: true, data: fullComment });
  } catch (error) {
    console.error('createComment error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Lấy bình luận theo sách (chỉ lấy comment gốc, replies được nested)
 * GET /api/v1/comments/:bookId
 */
const getCommentsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const comments = await Comment.findAll({
      where: { bookId, parentId: null, status: 'visible' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'avatarUrl']
        },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'visible' },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName', 'avatarUrl']
          }],
          order: [['created_at', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('getCommentsByBook error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Xóa bình luận (chỉ chủ sở hữu hoặc admin)
 * DELETE /api/v1/comments/:id
 * Auth: Required
 */
const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    // Chỉ chủ sở hữu hoặc admin mới được xóa
    // (kiểm tra admin cần lấy user từ DB, tạm thời so sánh userId)
    if (comment.userId.toString() !== userId.toString()) {
      // Kiểm tra xem có phải admin không
      const User = require('../models/User');
      const currentUser = await User.findByPk(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
      }
    }

    // Hard delete (mất hoàn toàn)
    await comment.destroy();

    res.json({ success: true, message: 'Đã xóa bình luận' });
  } catch (error) {
    console.error('deleteComment error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Lấy toàn bộ bình luận (Dành cho Admin)
 * GET /api/v1/comments/admin/all
 * Query: bookId (optional), status (optional)
 * Auth: Admin
 */
const getAllCommentsAdmin = async (req, res) => {
  try {
    const { bookId, status } = req.query;
    const whereClause = {};
    
    if (bookId) whereClause.bookId = bookId;
    if (status && status !== 'all') whereClause.status = status;

    const comments = await Comment.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'avatarUrl', 'email'] },
        { model: require('../models/Book'), as: 'book', attributes: ['id', 'title'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('getAllCommentsAdmin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Ẩn/Hiện bình luận (Dành cho Admin)
 * PUT /api/v1/comments/admin/:id/toggle-status
 * Auth: Admin
 */
const toggleCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
    }

    const newStatus = comment.status === 'hidden' ? 'visible' : 'hidden';
    await comment.update({ status: newStatus });

    res.json({ success: true, message: `Đã ${newStatus === 'hidden' ? 'ẩn' : 'hiện'} bình luận`, data: comment });
  } catch (error) {
    console.error('toggleCommentStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { createComment, getCommentsByBook, deleteComment, getAllCommentsAdmin, toggleCommentStatus };
