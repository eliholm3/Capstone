process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

function mockReqRes(headers = {}) {
  const req = { headers };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('auth middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('401 — no Authorization header', () => {
    const { req, res, next } = mockReqRes({});
    auth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401 — header does not start with Bearer', () => {
    const { req, res, next } = mockReqRes({ authorization: 'Token abc123' });
    auth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('401 — invalid/expired token', () => {
    const { req, res, next } = mockReqRes({ authorization: 'Bearer invalidtoken' });
    auth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for valid token', () => {
    const token = jwt.sign({ user_id: 1, username: 'alice' }, 'test-secret', { expiresIn: '1h' });
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.user_id).toBe(1);
    expect(req.user.username).toBe('alice');
  });
});
