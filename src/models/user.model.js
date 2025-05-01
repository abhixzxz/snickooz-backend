import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  username: {
    type: String,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  avatar: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'busy', 'away', 'offline'],
    default: 'offline'
  },
  statusMessage: {
    type: String,
    maxlength: 100
  },
  location: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  company: {
    type: String,
    trim: true
  },
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String,
    instagram: String
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(this.password, salt, 1000, 64, 'sha512').toString('hex');
    this.password = `${salt}:${hash}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  const [salt, storedHash] = this.password.split(':');
  const hash = crypto.pbkdf2Sync(candidatePassword, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
};

// Method to get public profile
userSchema.methods.toPublicProfile = function() {
  const publicProfile = this.toObject();
  delete publicProfile.password;
  delete publicProfile.refreshToken;
  return publicProfile;
};

const User = mongoose.model('User', userSchema);

export default User;