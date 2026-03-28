require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('./models/Location');

const districts = [
  { name: 'Thiruvananthapuram', icon: '🏛️' },
  { name: 'Kollam', icon: '🚤' },
  { name: 'Pathanamthitta', icon: '⛰️' },
  { name: 'Alappuzha', icon: '🛶' },
  { name: 'Kottayam', icon: '📖' },
  { name: 'Idukki', icon: '🏞️' },
  { name: 'Ernakulam', icon: '🏙️' },
  { name: 'Thrissur', icon: '🐘' },
  { name: 'Palakkad', icon: '🌾' },
  { name: 'Malappuram', icon: '⚽' },
  { name: 'Kozhikode', icon: '🍛' },
  { name: 'Wayanad', icon: '🌲' },
  { name: 'Kannur', icon: '🌊' },
  { name: 'Kasaragod', icon: '🏯' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    for (const d of districts) {
      const exists = await Location.findOne({ name: d.name });
      if (!exists) {
        await Location.create(d);
        console.log(`Added ${d.name}`);
      } else {
        console.log(`${d.name} already exists`);
      }
    }
    console.log('Finished seeding Kerala districts');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
