const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');
const messageSchema = new mongoose.Schema({}, { strict: false, collection: 'Messages' })

messageSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
};
const Message = mongoose.model('Message',
  messageSchema
)

module.exports = Message