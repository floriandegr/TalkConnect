const express = require('express')
const router = express.Router()
const BaseAction = require('../models/BaseAction')

router.get('/', async (req, res) => {
  const actions = await BaseAction.find()
  res.send(actions)
})

module.exports = router