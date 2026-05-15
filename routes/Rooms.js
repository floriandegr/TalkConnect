
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
// MOVE THROUGH DOOR - user moves from one room to another via a connected door
router.post('/room/:id/move/:targetRoomId', auth, async (req, res) => {
  try {
    const currentRoom = await Room.findOne({
      _id: req.params.id,
      occupants: req.user._id  // ← user must be in the current room
    });

    if (!currentRoom) return res.status(404).json({ message: 'You are not in this room' });

    // 1. Check if the target room is connected (door exists)
    const isDoorConnected = currentRoom.connectedRooms.some(
      roomId => roomId.toString() === req.params.targetRoomId
    );

    if (!isDoorConnected) return res.status(403).json({ message: 'No door to that room' });

    // 2. Remove user from current room
    await Room.findByIdAndUpdate(
      req.params.id,
      { $pull: { occupants: req.user._id } }
    );

    // 3. Add user to target room
    const targetRoom = await Room.findByIdAndUpdate(
      req.params.targetRoomId,
      { $addToSet: { occupants: req.user._id } },
      { new: true }
    ).populate('occupants');

    if (!targetRoom) return res.status(404).json({ message: 'Target room not found' });

    res.json({ 
      message: `Moved to ${targetRoom.name}`,
      room: targetRoom 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET CURRENT ROOM - get the room the user is currently in
router.get('/room/current', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ 
      occupants: req.user._id  // ← find the room where user is an occupant
    })
    .populate('occupants', 'name')
    .populate('connectedRooms', 'name public');

    if (!room) return res.status(404).json({ message: 'You are not in any room' });

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});