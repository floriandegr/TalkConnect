
router.post('/room', auth, async (req, res) => {
  try {
    if(req.body.name = "lobby"){
        res.status(400).json({message : "you can't name your room lobby"})
    }
    const room = new Room({
      ...req.body,
      createdBy: req.user._id,
      public: req.body.public ?? false,
      connectedRooms: req.body.connectedRooms ?? [],
      occupants: []
    });

    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ALL - get rooms the user created or is an occupant of
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { createdBy: req.user._id },
        { occupant: req.user._id },
        {public: true}
      ]
    })
    .populate('occupant')
    .populate('connectedRooms');

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ONE - get a single room
router.get('/room/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { occupants: req.user._id }
      ]
    })
    .populate('occupants')
    .populate('connectedRooms');

    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE - only the creator can update
router.put('/room/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { 
        _id: req.params.id, 
        createdBy: req.user._id  // ← only creator can edit
      },
      {
        $set: {
            ...req.body,
          
          public: req.body.public ?? false,
          connectedRooms: req.body.connectedRooms,
          occupants: []
        }
      },
      { new: true, runValidators: true }
    )
    
    
    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE - only the creator can delete
router.delete('/room/:id', auth, async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user._id
    });

    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });

    // 1. Find the lobby room
    const lobby = await Room.findOne({ name: 'lobby' });

    if (!lobby) return res.status(404).json({ message: 'Lobby room not found' });

    // 2. Move all occupants from the deleted room to the lobby
    await Room.findByIdAndUpdate(
      lobby._id,
      { $addToSet: { occupants: { $each: room.occupants } } }  // ← add all occupants to lobby
    );

    res.json({ message: 'Room deleted, users moved to lobby' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD OCCUPANT - creator adds a user to the room
router.post('/room/:id/occupant', auth, async (req, res) => {
  try {
    // 1. Remove user from any room they're currently in
    await Room.updateMany(
      { occupants: req.body.userId },
      { $pull: { occupants: req.body.userId } }
    );

    // 2. Add user to the new room
    const room = await Room.findOneAndUpdate(
      { 
        _id: req.params.id, 
        createdBy: req.user._id  // ← only creator can add occupants
      },
      { $addToSet: { occupants: req.body.userId } },
      { new: true }
    ).populate('occupants');

    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REMOVE OCCUPANT - creator removes a user from the room (unchanged)
router.delete('/room/:id/occupant/:userId', auth, async (req, res) => {
  try {
    // 1. Remove user from the room
    const room = await Room.findOneAndUpdate(
      { 
        _id: req.params.id, 
        createdBy: req.user._id
      },
      { $pull: { occupants: req.params.userId } },
      { new: true }
    ).populate('occupants');

    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });

    // 2. Move user to lobby
    const lobby = await Room.findOneAndUpdate(
      { name: 'lobby' },
      { $addToSet: { occupants: req.params.userId } },
      { new: true }
    );

    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    res.json({ room, lobby });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});