jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const db = require('../db');
const bcrypt = require('bcrypt');
const { loginHandler } = require('../routes/login');

function mockReqRes(body = {}) {
  const req = { body };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  return { req, res };
}

const fakeUser = { user_id: 1, username: 'alice', password_hash: '$2b$10$hashedpassword' };

describe('POST /api/user/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs in and returns token', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeUser] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const { req, res } = mockReqRes({ username: 'alice', password: 'password123' });
    await loginHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('alice');

    const decoded = jwt.verify(res.body.token, 'test-secret');
    expect(decoded.user_id).toBe(1);
  });

  it('400 — missing username', async () => {
    const { req, res } = mockReqRes({ password: 'password123' });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('400 — missing password', async () => {
    const { req, res } = mockReqRes({ username: 'alice' });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('401 — user not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ username: 'nobody', password: 'password123' });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('401 — wrong password', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeUser] });
    bcrypt.compare.mockResolvedValueOnce(false);
    const { req, res } = mockReqRes({ username: 'alice', password: 'wrong' });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ username: 'alice', password: 'password123' });
    await loginHandler(req, res);
    expect(res.statusCode).toBe(500);
  });
});
