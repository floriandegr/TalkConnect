const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'Users' })

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
};
const User = mongoose.model('User',
  userSchema
)

module.exports = User