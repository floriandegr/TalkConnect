const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// SEND MESSAGE
router.post('/message', auth, async (req, res) => {
  try {
    // if whisper, roomId is required and user must be in that room
    if (req.body.whisper) {
      if (!req.body.roomId) return res.status(400).json({ message: 'Whisper requires a roomId' });

      const room = await Room.findOne({ 
        _id: req.body.roomId, 
        occupants: req.user._id 
      });

      if (!room) return res.status(403).json({ message: 'You are not in this room' });
    }

    const message = new Message({
      ...req.body,
      senderId: req.user._id,  // ← always override sender
      sentAt: new Date(),
      whisper: req.body.whisper ?? false,
      roomId: req.body.whisper ? req.body.roomId : null  // ← only set roomId if whisper
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL GLOBAL MESSAGES - not whispers
router.get('/messages', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ whisper: false })
      .populate('senderId', 'name email')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET MESSAGES IN A ROOM - whispers only visible if user is in the room
router.get('/messages/room/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ 
      _id: req.params.roomId, 
      occupants: req.user._id  // ← must be in room to see whispers
    });

    if (!room) return res.status(403).json({ message: 'You are not in this room' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      $or: [
        { whisper: false },                           // ← global messages everyone sees
        { whisper: true, roomId: req.params.roomId }  // ← whispers only for this room
      ]
    })
      .populate('senderId', 'name email')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
