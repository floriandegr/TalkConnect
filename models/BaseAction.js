const mongoose = require('mongoose')

const BaseAction = mongoose.model('BaseAction',
  new mongoose.Schema({}, { strict: false, collection: 'BaseActions' })
)

module.exports = BaseAction