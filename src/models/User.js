import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // User model schema will be defined here
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);