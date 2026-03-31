const express = require('express');
const cors = require('cors');

const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const datasetsRouter = require('./routes/datasets');
const imagesRouter = require('./routes/images');

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/user/register', registerRouter);
app.use('/api/user/login', loginRouter);

// Dataset routes
app.use('/api/datasets', datasetsRouter);

// Image routes (nested under datasets)
app.use('/api/datasets', imagesRouter);

module.exports = app;
