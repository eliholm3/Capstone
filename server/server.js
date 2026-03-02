require('dotenv').config();
const express = require('express');

const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const testRouter = require('./routes/test');

const app = express();
app.use(express.json());

app.use('/api/user/login', loginRouter);
app.use('/api/user/create', registerRouter);
app.use('/api/test', testRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
