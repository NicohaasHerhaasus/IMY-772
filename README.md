# IMY-772

Full documentation are in the [Docs](Docs/) folder:

- [System Overview](Docs/System-Overview.md) — What the system is and how it solves the problem.
- [Setup & Deployment Guide](Docs/Setup-and-Deployment-Guide.md) — Guide on how to run app.
- [Operations Guide](Docs/Operations-Guide.md) — How to use the features of the app as a admin and a general user.

Below is a quick start for local development:

## Setup

Both the frontend and API require their own environment file before you can run them. Neither file is committed - copy the example and fill in your values.

**Frontend** (`frontend/.env.local`):
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local - see comments inside for where to find each Cognito value
```

**API** (`api/.env`):
```bash
cd api
cp .env.example .env
# Edit .env - fill in DB credentials and the same Cognito User Pool ID + Client ID
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
