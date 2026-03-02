require('dotenv').config();
const express = require('express');

const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');

const app = express();
app.use(express.json());

app.use('/api/user/login', loginRouter);
app.use('/api/user/create', registerRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
