# IMY-772

## Setup

Both the frontend and API require their own environment file before you can run them. Neither file is committed — copy the example and fill in your values.

**Frontend** (`frontend/.env.local`):
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local — see comments inside for where to find each Cognito value
```

**API** (`api/.env`):
```bash
cd api
cp .env.example .env
# Edit .env — fill in DB credentials and the same Cognito User Pool ID + Client ID
```

---

## Frontend startup

```bash
cd frontend
npm install
npm run dev
```

## API startup

```bash
cd api
npm install
npm run dev
```

See [api/README.md](api/README.md) for a full backend overview, authentication details, and how to protect API endpoints.
