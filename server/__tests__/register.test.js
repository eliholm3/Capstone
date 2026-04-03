jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const db = require('../db');
const { registerHandler } = require('../routes/register');

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

const validBody = { username: 'alice', email: 'alice@example.com', password: 'password123' };

describe('POST /api/user/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates user and returns 201 with token', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ user_id: 1, username: 'alice', email: 'alice@example.com', created_at: '2026-01-01' }],
      });

    const { req, res } = mockReqRes(validBody);
    await registerHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.username).toBe('alice');
    expect(res.body.email).toBe('alice@example.com');

    const decoded = jwt.verify(res.body.token, 'test-secret');
    expect(decoded.user_id).toBe(1);
  });

  it('400 — missing username', async () => {
    const { req, res } = mockReqRes({ email: 'a@b.com', password: 'password123' });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('400 — missing email', async () => {
    const { req, res } = mockReqRes({ username: 'alice', password: 'password123' });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('400 — missing password', async () => {
    const { req, res } = mockReqRes({ username: 'alice', email: 'a@b.com' });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('400 — password too short', async () => {
    const { req, res } = mockReqRes({ ...validBody, password: 'short' });
    await registerHandler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('409 — username or email already taken', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    const { req, res } = mockReqRes(validBody);
    await registerHandler(req, res);
    expect(res.statusCode).toBe(409);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes(validBody);
    await registerHandler(req, res);
    expect(res.statusCode).toBe(500);
  });
});
