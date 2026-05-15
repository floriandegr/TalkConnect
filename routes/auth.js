const Joi = require('joi');
const bcrypt = require('bcrypt');
const { User } = require('../models/User');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ name: req.body.name });
  if (!user) return res.status(400).send('Invalid name or password');

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send('Invalid name or password');

    const token = user.generateAuthToken();
    res.send(token);
});

function validate(req) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).email().required(),
    password: Joi.string().min(5).max(255).required()
  });
  return schema.validate(req);
}

module.exports = router;