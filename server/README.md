## Quick Start

### Register
```bash
curl -X POST http://ec2-3-144-42-190.us-east-2.compute.amazonaws.com/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"username": "xavier", "email": "xavier@example.com", "password": "password"}'
```

### Login
```bash
curl -X POST http://ec2-3-144-42-190.us-east-2.compute.amazonaws.com/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username": "xavier", "password": "password"}'
```

---

## API Routes

### User

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/user/register` | No | Register with username, email, password |
| POST | `/api/user/login` | No | Login with username, password |

### Datasets

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/datasets` | Yes | Create dataset (name, search_term) |
| GET | `/api/datasets` | Yes | List all your datasets |
| GET | `/api/datasets/:id` | Yes | Get a specific dataset |
| DELETE | `/api/datasets/:id` | Yes | Delete a dataset |

### Images

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/datasets/:datasetId/images` | Yes | Add image (url, optionally title, license, status) |
| GET | `/api/datasets/:datasetId/images` | Yes | List all images in a dataset |
| GET | `/api/datasets/:datasetId/images/:imageId` | Yes | Get a specific image |
| PATCH | `/api/datasets/:datasetId/images/:imageId` | Yes | Update image status |
| DELETE | `/api/datasets/:datasetId/images/:imageId` | Yes | Delete an image |
