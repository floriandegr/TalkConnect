const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');
const config = require('config');
const RulesSchema = new mongoose.Schema({}, { strict: false, collection: 'Rules' })

RulesSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, config.get('jwtPrivateKey'));
  return token;
};
const Rules = mongoose.model('Rule',
  roomSchema
)

module.exports = Rules