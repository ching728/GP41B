const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  }
}, {
  timestamps: true
});

// 使用更簡單的 pre-save hook
userSchema.pre('save', function(next) {
  const user = this;
  
  // 只在密碼被修改時才進行雜湊
  if (!user.isModified('password')) return next();
  
  console.log('Hashing password for user:', user.username);
  
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      
      user.password = hash;
      console.log('Password hashed successfully');
      next();
    });
  });
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Password comparison error:', err);
    throw err;
  }
};

module.exports = mongoose.model('User', userSchema);
