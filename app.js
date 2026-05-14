const express = require('express')
const mongoose = require('mongoose')



const app = express()
app.use(express.json())

// ─── Connect ─────────────────────────────────
mongoose.connect('mongodb://localhost/TalkConnect')
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.log('Connection error:', err))

// ─── Models (pointing to your Compass collections) ───
const BaseAction = mongoose.model('BaseAction',
  new mongoose.Schema({}, { strict: false, collection: 'BaseActions' })
)
const result = baseaction.save()
// ─── Routes ──────────────────────────────────
app.get('/baseactions', async (req, res) => {
  const actions = await BaseAction.find()
  res.send(actions)
})

app.post('/baseactions', async (req, res) => {
  const action = await BaseAction.create(req.body)
  res.send(action)
})

// ─── Start ────────────────────────────────────
app.listen(3000, () => {
  console.log('Listening on port 3000...')
})