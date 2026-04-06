jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const db = require('../db');
const bcrypt = require('bcrypt');
const { exportImages, exportLogin } = require('../routes/export');

function mockReqRes({ body = {}, params = {}, query = {}, user = { user_id: 1 } } = {}) {
  const req = { body, params, query, user };
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    setHeader(key, val) { this.headers[key] = val; },
    send(data) { this.body = data; return this; },
  };
  return { req, res };
}

describe('GET /api/export/images (exportImages)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns CSV with approved images', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ dataset_id: 1 }] }) // dsCheck
      .mockResolvedValueOnce({
        rows: [
          { image_id: 1, url: 'http://a.jpg', title: 'A', license: 'CC0' },
          { image_id: 2, url: 'http://b.jpg', title: 'B', license: 'CC-BY' },
        ],
      });

    const { req, res } = mockReqRes({ query: { dataset_id: '1' } });
    await exportImages(req, res);

    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.headers['Content-Disposition']).toBe('attachment; filename=dataset_1.csv');
    expect(res.body).toContain('image_id,url,title,license');
    expect(res.body).toContain('http://a.jpg');
    expect(res.body).toContain('http://b.jpg');
  });

  it('200 — returns CSV headers only when no approved images', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ dataset_id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const { req, res } = mockReqRes({ query: { dataset_id: '1' } });
    await exportImages(req, res);

    expect(res.headers['Content-Type']).toBe('text/csv');
    expect(res.body).toBe('image_id,url,title,license');
  });

  it('400 — missing dataset_id', async () => {
    const { req, res } = mockReqRes({ query: {} });
    await exportImages(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('404 — dataset not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ query: { dataset_id: '999' } });
    await exportImages(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ query: { dataset_id: '1' } });
    await exportImages(req, res);
    expect(res.statusCode).toBe(500);
  });
});

const fakeUser = { user_id: 1, username: 'alice', password_hash: '$2b$10$hashedpassword' };

describe('POST /api/export/login (exportLogin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns token on valid credentials', async () => {
    db.query.mockResolvedValueOnce({ rows: [fakeUser] });
    bcrypt.compare.mockResolvedValueOnce(true);

    const { req, res } = mockReqRes({ body: { username: 'alice', password: 'password123' } });
    await exportLogin(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('alice');
    const decoded = jwt.verify(res.body.token, 'test-secret');
    expect(decoded.user_id).toBe(1);
  });

  it('400 — missing username or password', async () => {
    const { req, res } = mockReqRes({ body: { password: 'password123' } });
    await exportLogin(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('401 — invalid credentials', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ body: { username: 'nobody', password: 'wrong' } });
    await exportLogin(req, res);
    expect(res.statusCode).toBe(401);
  });
});
