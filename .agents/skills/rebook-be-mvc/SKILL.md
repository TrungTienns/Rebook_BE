---
name: rebook-be-mvc
description: >
  Cheatsheet and step-by-step guide for generating new MVC features (Model, Route, Controller)
  for the Rebook backend. Use this skill whenever the user asks to create a new API, entity,
  or feature for the rebook_BE project.
---

# Rebook Backend — MVC Feature Generation Guide

## Project Overview

- **Framework**: Express.js (v5)
- **ORM**: Sequelize v6 + MySQL2
- **Architecture**: MVC — Models → Controllers → Routes → registered in `src/routes/index.js`
- **Auth**: JWT via `src/middleware/authMiddleware.js` (`protect` middleware)
- **File Upload**: Multer + Cloudinary via `src/config/cloudinary.js` (`uploadCloudImage`)
- **API Docs**: Swagger JSDoc (annotate routes with `@swagger` comments)
- **Base API prefix**: `/api/v1` (mounted in `src/app.js`)

---

## Directory Structure

```
src/
├── config/           # db.js, cloudinary.js, firebase.js, swagger.js
├── controllers/      # <Feature>Controller.js
├── middleware/       # authMiddleware.js  (protect, role guards, etc.)
├── middlewares/      # (alias folder — keep consistent with existing)
├── models/           # <Feature>.js  (Sequelize model definitions)
├── routes/
│   ├── index.js      # ← ALWAYS register new routes here
│   └── <feature>Routes.js
├── services/         # (optional) business logic extracted from controllers
├── utils/            # helper functions
├── app.js
└── server.js
```

---

## Step-by-Step: Adding a New Feature

### STEP 1 — Create the Model (`src/models/<Feature>.js`)

Follow this exact template, matching the existing `Book.js` pattern:

```js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeatureName = sequelize.define('FeatureName', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

  // camelCase JS property → snake_case DB column via `field`
  exampleField: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'example_field'
  },
}, {
  tableName: 'table_name',   // plural snake_case matching database.sql
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// --- ASSOCIATIONS (define at bottom, after model) ---
// FeatureName.belongsTo(OtherModel, { foreignKey: 'otherId', as: 'alias' });
// FeatureName.hasMany(OtherModel, { foreignKey: 'featureId', as: 'items' });

module.exports = FeatureName;
```

**DataType Reference:**
| SQL Type | Sequelize Type |
|---|---|
| VARCHAR(n) | DataTypes.STRING(n) |
| TEXT / LONGTEXT | DataTypes.TEXT |
| BOOLEAN | DataTypes.BOOLEAN |
| ENUM('a','b') | DataTypes.ENUM('a','b') |
| INT UNSIGNED | DataTypes.INTEGER.UNSIGNED |
| BIGINT UNSIGNED | DataTypes.BIGINT.UNSIGNED |
| DECIMAL(p,s) | DataTypes.DECIMAL(p, s) |
| DATETIME | DataTypes.DATE |

---

### STEP 2 — Create the Controller (`src/controllers/<feature>Controller.js`)

```js
const FeatureName = require('../models/FeatureName');

const getAll = async (req, res) => {
  try {
    const items = await FeatureName.findAll();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await FeatureName.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { field1, field2 } = req.body;
    const item = await FeatureName.create({ field1, field2 });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await FeatureName.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await item.update(req.body);
    res.json({ success: true, message: 'Updated successfully', data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await FeatureName.findByPk(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await item.destroy();
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAll, getById, create, update, remove };
```

**Controller Rules:**
- Every handler is `async/await` wrapped in `try/catch`
- Error: `{ success: false, message: '...' }`
- Success: `{ success: true, data: ... }` or `{ success: true, message: '...' }`
- Use `console.error(error)` not `console.log`
- Never use `delete` as function name (JS keyword) — use `remove`

---

### STEP 3 — Create the Route File (`src/routes/<feature>Routes.js`)

```js
const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/featureController');
const { protect } = require('../middleware/authMiddleware');
// const { uploadCloudImage } = require('../config/cloudinary'); // only if file upload needed

/**
 * @swagger
 * tags:
 *   name: FeatureName
 *   description: FeatureName management APIs
 */

/**
 * @swagger
 * /feature:
 *   get:
 *     summary: Get all feature items
 *     tags: [FeatureName]
 *     responses:
 *       200:
 *         description: List of items
 */
router.get('/', getAll);

// IMPORTANT: Static routes BEFORE parameterised routes
// router.get('/search', searchHandler);  // ← must be before /:id

/**
 * @swagger
 * /feature/{id}:
 *   get:
 *     summary: Get feature item by ID
 *     tags: [FeatureName]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Not found
 */
router.get('/:id', getById);

/**
 * @swagger
 * /feature:
 *   post:
 *     summary: Create a new feature item
 *     tags: [FeatureName]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, create);
// With file upload: router.post('/', protect, uploadCloudImage.single('image'), create);

/**
 * @swagger
 * /feature/{id}:
 *   put:
 *     summary: Update feature item by ID
 *     tags: [FeatureName]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', protect, update);

/**
 * @swagger
 * /feature/{id}:
 *   delete:
 *     summary: Delete feature item by ID
 *     tags: [FeatureName]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', protect, remove);

module.exports = router;
```

---

### STEP 4 — Register in `src/routes/index.js`

```js
// 1. Import at top
const featureRoutes = require('./featureRoutes');

// 2. Register (use kebab-case URL)
router.use('/features', featureRoutes);
```

---

## Naming Conventions

| Layer | File Name | JS Name | URL |
|---|---|---|---|
| Model | `FeatureName.js` | `FeatureName` | — |
| Controller | `featureController.js` | functions | — |
| Routes | `featureRoutes.js` | router | — |
| DB Table | — | — | `feature_name` (snake) |
| URL prefix | — | — | `/feature-name` (kebab) |

**Examples from codebase:**
- `ReadingHistory.js` → `readingHistoryController.js` → `readingHistoryRoutes.js` → `/reading-history`
- `BookCategory.js` → junction table only, no dedicated route

---

## Response Format Standard

```js
res.json({ success: true, data: [...] });                          // GET list
res.json({ success: true, data: item });                           // GET single
res.status(201).json({ success: true, data: newItem });            // POST created
res.json({ success: true, message: 'Updated successfully', data: item }); // PUT
res.json({ success: true, message: 'Deleted successfully' });      // DELETE
res.status(400).json({ success: false, message: 'Bad request' }); // validation fail
res.status(401).json({ success: false, message: 'Not authorized' }); // auth fail
res.status(404).json({ success: false, message: 'Not found' });   // not found
res.status(500).json({ success: false, message: 'Server error' }); // server error
```

---

## Auth — Access Current User in Controller

```js
const { protect } = require('../middleware/authMiddleware');
// After protect middleware runs:
req.user  // → decoded JWT payload { id, email, role, ... }
```

---

## Cloudinary File Upload Pattern

```js
// Route
const { uploadCloudImage } = require('../config/cloudinary');
router.post('/', protect, uploadCloudImage.single('fieldName'), create);

// Controller
const imageUrl = req.file ? req.file.path : null;  // req.file.path = Cloudinary URL
```

---

## Sequelize Association Quick Reference

```js
// One-to-Many
Parent.hasMany(Child, { foreignKey: 'parentId', as: 'children' });
Child.belongsTo(Parent, { foreignKey: 'parentId', as: 'parent' });

// Many-to-Many via junction table
A.belongsToMany(B, { through: ABJunction, as: 'bs', foreignKey: 'aId', otherKey: 'bId' });
B.belongsToMany(A, { through: ABJunction, as: 'as', foreignKey: 'bId', otherKey: 'aId' });

// Usage in controller
const item = await A.findByPk(id, {
  include: [{ model: B, as: 'bs', attributes: ['id', 'name'], through: { attributes: [] } }]
});
```

---

## Final Checklist

- [ ] Model in `src/models/<Feature>.js`
  - [ ] `tableName` matches `schema.md` exactly
  - [ ] `field: 'snake_case'` for every camelCase property
  - [ ] Associations defined at bottom of file
  - [ ] `timestamps: true` with `createdAt`/`updatedAt` column names
- [ ] Controller in `src/controllers/<feature>Controller.js`
  - [ ] All handlers use `async/await` + `try/catch`
  - [ ] Response format follows `{ success, data/message }` standard
  - [ ] No `delete` function name — use `remove`
- [ ] Route in `src/routes/<feature>Routes.js`
  - [ ] Static paths declared before parameterised paths
  - [ ] `@swagger` JSDoc added to all endpoints
  - [ ] Protected routes use `protect` middleware
- [ ] Route registered in `src/routes/index.js` with `kebab-case` URL
