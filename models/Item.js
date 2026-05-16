const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');
const itemSchema = new mongoose.Schema({}, { strict: false, collection: 'Items' })

itemSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
};
const Items = mongoose.model('Item',
  itemSchema
)

module.exports = Items