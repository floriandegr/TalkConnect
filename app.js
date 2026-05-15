const express = require('express')
const app = express()
const config = require('config');

if (!config.get('jwtPrivateKey')) {
  console.error('FATAL ERROR: jwtPrivateKey not defined.');
  process.exit(1);
}
require('./db') // connects to mongodb

app.use(express.json())

// ─── Routes ──────────────────────────────────
app.use('/baseactions', require('./routes/baseactions'))
app.use('/users',       require('./routes/users'))
app.use('/api/auth',   require('.routes/auth  '));
app.use('/rooms',       require('./routes/rooms'))
app.use('/items',       require('./routes/items'))

// ─── Start ────────────────────────────────────
app.listen(3000, () => {
  console.log('Listening on port 3000...')
})