require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    let admin = await User.findOne({ email: 'admin@playslot.com' });
    if (admin) {
      console.log('Admin already exists. Email: admin@playslot.com | Password: password123');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      admin = new User({
        name: 'Super Admin',
        email: 'admin@playslot.com',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin created successfully!');
      console.log('Email: admin@playslot.com');
      console.log('Password: password123');
    }
  } catch(err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
