const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/TalkConnect')
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log('Connection error:', err))

module.exports = mongoose