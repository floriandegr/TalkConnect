const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');
const roomSchema = new mongoose.Schema({}, { strict: false, collection: 'Rooms' })

roomSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
};
const Room = mongoose.model('Room',
  roomSchema
)

module.exports = Room