const { Item } = require('../models/Item');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ─── Get all items (public) ───────────────────
router.get('/', async (req, res) => {
  const items = await Item.find();
  res.send(items);
});

// ─── Get item by id (public) ──────────────────
router.get('/:id', async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).send('Item not found');
  res.send(item);
});

// ─── Create item (must be logged in) ─────────
router.post('/', auth, async (req, res) => {
  const item = new Item({
    ...req.body,
    createdBy: req.user._id // ← automatically from token
  });
  await item.save();
  res.send(item);
});

// ─── Update item (must be creator) ───────────
router.put('/:id', auth, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).send('Item not found');

  // Check if user owns this item
  if (item.createdBy.toString() !== req.user._id)
    return res.status(403).send('You can only edit your own items');

  const updated = await Item.findByIdAndUpdate(
    req.params.id,
    { ...req.body },
    { new: true }
  );
  res.send(updated);
});

// ─── Delete item (must be creator) ───────────
router.delete('/:id', auth, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).send('Item not found');

  // Check if user owns this item
  if (item.createdBy.toString() !== req.user._id)
    return res.status(403).send('You can only delete your own items');

  await Item.findByIdAndDelete(req.params.id);
  res.send(item);
});

module.exports = router;