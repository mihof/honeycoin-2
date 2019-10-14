const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
});

const db = mongoose.connection;

db.on('connected', () => {
  console.log(`Connected to MongoDB`);
});

module.exports = mongoose;