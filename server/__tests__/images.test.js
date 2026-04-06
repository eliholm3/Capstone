jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('../services/wikimedia', () => ({
  fetchWikimediaImages: jest.fn().mockResolvedValue({ images: [], nextOffset: null }),
}));

const db = require('../db');
const { getImages, getImage, addImage, patchImage, deleteImage } = require('../routes/images');

function mockReqRes({ body = {}, params = {}, query = {}, user = { user_id: 1 } } = {}) {
  const req = { body, params, query, user };
  const res = {
    statusCode: 200,
    body: null,
    headersSent: false,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; this.headersSent = true; return this; },
  };
  return { req, res };
}

describe('GET /api/datasets/:datasetId/images (getImages)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns pending images array', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ image_id: 1, url: 'http://a.jpg', title: 'A' }] }) // main query
      .mockResolvedValueOnce({ rows: [{ count: '20' }] }); // count for refill check
    const { req, res } = mockReqRes({ params: { datasetId: '1' } });
    await getImages(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(1);
  });

  it('200 — returns empty array when no pending images', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ search_term: 'cats', provider_offsets: {} }] });
    const { req, res } = mockReqRes({ params: { datasetId: '1' } });
    await getImages(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ params: { datasetId: '1' } });
    await getImages(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/datasets/:datasetId/images/:imageId (getImage)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns single image', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ image_id: 5, url: 'http://img.jpg' }] });
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' } });
    await getImage(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.image_id).toBe(5);
  });

  it('404 — image not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '999' } });
    await getImage(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' } });
    await getImage(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('POST /api/datasets/:datasetId/images (addImage)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 — creates and returns image', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ dataset_id: 1 }] }) // dsCheck
      .mockResolvedValueOnce({ rows: [{ image_id: 10, url: 'http://new.jpg', status: 'pending' }] }); // INSERT
    const { req, res } = mockReqRes({ params: { datasetId: '1' }, body: { url: 'http://new.jpg' } });
    await addImage(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.image_id).toBe(10);
  });

  it('400 — missing url', async () => {
    const { req, res } = mockReqRes({ params: { datasetId: '1' }, body: {} });
    await addImage(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('404 — dataset not found / wrong user', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // dsCheck returns nothing
    const { req, res } = mockReqRes({ params: { datasetId: '999' }, body: { url: 'http://img.jpg' } });
    await addImage(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ params: { datasetId: '1' }, body: { url: 'http://img.jpg' } });
    await addImage(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('PATCH /api/datasets/:datasetId/images/:imageId (patchImage)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — updates status to approved', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ image_id: 5, status: 'approved' }] });
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' }, body: { status: 'approved' } });
    await patchImage(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('200 — updates status to rejected', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ image_id: 5, status: 'rejected' }] });
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' }, body: { status: 'rejected' } });
    await patchImage(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400 — invalid status value', async () => {
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' }, body: { status: 'maybe' } });
    await patchImage(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('404 — image not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '999' }, body: { status: 'approved' } });
    await patchImage(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' }, body: { status: 'approved' } });
    await patchImage(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('DELETE /api/datasets/:datasetId/images/:imageId (deleteImage)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — deletes and returns success message', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ image_id: 5 }] });
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' } });
    await deleteImage(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Image deleted.');
  });

  it('404 — image not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '999' } });
    await deleteImage(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ params: { datasetId: '1', imageId: '5' } });
    await deleteImage(req, res);
    expect(res.statusCode).toBe(500);
  });
});
