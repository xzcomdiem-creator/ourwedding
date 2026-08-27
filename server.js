require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Wedding Invite API is running'));

const weddingsRoute = require('./routes/weddings');
const guestsRoute = require('./routes/guests');
const publicRoute = require('./routes/public');

app.use('/api/weddings', weddingsRoute);
app.use('/api/guests', guestsRoute);
app.use('/api/public', publicRoute);

// Middleware xử lý lỗi tập trung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// 404 cho các route không tồn tại
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
