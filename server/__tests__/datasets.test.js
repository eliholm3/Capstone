jest.mock('../db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient),
    __mockClient: mockClient,
  };
});
jest.mock('../services/wikimedia', () => ({
  fetchWikimediaImages: jest.fn(),
}));

const db = require('../db');
const { fetchWikimediaImages } = require('../services/wikimedia');
const { createDataset, listDatasets, getDataset, deleteDataset } = require('../routes/datasets');

function mockReqRes({ body = {}, params = {}, query = {}, user = { user_id: 1 } } = {}) {
  const req = { body, params, query, user };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  return { req, res };
}

describe('POST /api/datasets (createDataset)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.__mockClient.query.mockReset();
  });

  it('201 — creates dataset and returns it with image counts', async () => {
    const fakeDataset = { dataset_id: 10, user_id: 1, name: 'test', search_term: 'cats', total_images: 5 };
    db.__mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [fakeDataset] }) // INSERT dataset
      .mockResolvedValueOnce({ rows: [] }) // INSERT image (loop runs once)
      .mockResolvedValueOnce(undefined) // UPDATE offsets
      .mockResolvedValueOnce(undefined); // COMMIT

    fetchWikimediaImages.mockResolvedValueOnce({
      images: [{ url: 'http://img.jpg', title: 'Cat', license: 'CC0' }],
      nextOffset: 1,
    });

    const { req, res } = mockReqRes({ body: { name: 'test', search_term: 'cats', total_images: 5 } });
    await createDataset(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.dataset_id).toBe(10);
    expect(res.body.images_fetched).toBe(1);
  });

  it('400 — missing name', async () => {
    const { req, res } = mockReqRes({ body: { search_term: 'cats', total_images: 5 } });
    await createDataset(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('400 — missing search_term', async () => {
    const { req, res } = mockReqRes({ body: { name: 'test', total_images: 5 } });
    await createDataset(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('400 — missing total_images', async () => {
    const { req, res } = mockReqRes({ body: { name: 'test', search_term: 'cats' } });
    await createDataset(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('500 — database error', async () => {
    db.__mockClient.query.mockRejectedValueOnce(new Error('fail'));

    fetchWikimediaImages.mockResolvedValueOnce({ images: [], nextOffset: null });

    const { req, res } = mockReqRes({ body: { name: 'test', search_term: 'cats', total_images: 5 } });
    await createDataset(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/datasets (listDatasets)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns array of datasets', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ dataset_id: 1 }, { dataset_id: 2 }] });
    const { req, res } = mockReqRes();
    await listDatasets(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('200 — returns empty array when user has no datasets', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes();
    await listDatasets(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes();
    await listDatasets(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/datasets/:id (getDataset)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns single dataset with counts', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ dataset_id: 1, total_count: 10 }] });
    const { req, res } = mockReqRes({ params: { id: '1' } });
    await getDataset(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.dataset_id).toBe(1);
  });

  it('404 — dataset not found or wrong user', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ params: { id: '999' } });
    await getDataset(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ params: { id: '1' } });
    await getDataset(req, res);
    expect(res.statusCode).toBe(500);
  });
});

describe('DELETE /api/datasets/:id (deleteDataset)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — deletes and returns success message', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ dataset_id: 1 }] });
    const { req, res } = mockReqRes({ params: { id: '1' } });
    await deleteDataset(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Dataset deleted.');
  });

  it('404 — dataset not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const { req, res } = mockReqRes({ params: { id: '999' } });
    await deleteDataset(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('500 — database error', async () => {
    db.query.mockRejectedValueOnce(new Error('fail'));
    const { req, res } = mockReqRes({ params: { id: '1' } });
    await deleteDataset(req, res);
    expect(res.statusCode).toBe(500);
  });
});
