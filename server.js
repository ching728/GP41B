const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------
// Connect to MongoDB
// ----------------------
mongoose.connect('mongodb://localhost:27017/todoapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ----------------------
// Middleware
// ----------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----------------------
// Session setup
// ----------------------
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/todoapp' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ----------------------
// Make user available in all views
// ----------------------
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.user = user;
    } catch (err) {
      console.error('User lookup error:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// ----------------------
// Routes
// ----------------------
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// Home page
app.get('/', (req, res) => {
  res.render('home', { title: 'Home - Todo App' });
});

// ----------------------
// 除錯：顯示所有註冊的路由（修正版本）
// ----------------------
function printRoutes() {
  console.log('\n=== Registered Routes ===');
  app._router.stack.forEach((middleware) => {
    if (middleware.name === 'router') {
      // 這是路由器中間件
      console.log(`Router: ${middleware.regexp}`);
      if (middleware.handle && middleware.handle.stack) {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            const methods = Object.keys(handler.route.methods).map(method => method.toUpperCase()).join(', ');
            console.log(`  ${methods} -> ${handler.route.path}`);
          }
        });
      }
    } else if (middleware.route) {
      // 這是直接註冊的路由
      const methods = Object.keys(middleware.route.methods).map(method => method.toUpperCase()).join(', ');
      console.log(`${methods} -> ${middleware.route.path}`);
    }
  });
  console.log('=== End of Routes ===\n');
}

// 在伺服器啟動後打印路由
app.on('listening', () => {
  printRoutes();
});

// ----------------------
// 錯誤處理中間件
// ----------------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('error', { 
    error: 'Something went wrong!',
    title: 'Error - Todo App'
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).render('error', {
    error: 'Page not found',
    title: '404 - Todo App'
  });
});

// ----------------------
// Start server
// ----------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
