# Setup & Deployment Guide : EcoMap AMR Surveillance Dashboard

This guide helps you use the EcoMap app.

You cna follow 2 approaches:

- Run it locally (dev)
- Deploy it to a server (prod)

## What the system is madde of

EcoMap has three parts:

1. Database
2. API
3. Frontend 

It also uses AWS services:

4. AWS Cognito (login)
5. AWS Bedrock (chatbot)

## Prerequisites

Install the following:

- Node.js
- PostgreSQL
- Git

You shouls also:

- Create a AWS account with Cognito and Bedrock available in your region (for login and
  the chatbot).



# Part A : Run it locally

### Step 1 : CLone repo

```bash
git clone <your-repository-url> ecomap
cd ecomap
```

### Step 2 : Get PostgreSQL running

The API creates the databasse and tables automatically on start, so you dont
need to create it.

- On macOS (Homeebrew): `brew services start postgresql`
- On Windows: PostgreSQL runs as a service after install (check "Services").
- On Linux: `sudo systemctl start postgresql`

The default settings in the example file expect a user `postgres` with password `postgres`. If
your Postgres uses different credentials, you will set them in Step 4.

### Step 3 : Configure the API

```bash
cd api
cp .env.example .env
```

Open `api/.env` and full it in:

```ini
PORT=3000
NODE_ENV=development

# Database (must match your local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=imy772

# AWS Cognito (admin login)
# AWS Console → Cognito → User Pools → your pool → Overview
COGNITO_USER_POOL_ID=eu-north-1_xxxxxxxxx
# AWS Console → Cognito → User Pools → your pool → App clients
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

#  AWS Bedrock (AMR Assistant chatbot) 
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

> The database does not have to existd yet. On startup the API connects, creates the
> `imy772` database if it is missing, then runs all migrations to build the tables.

### Step 4 : Start the API

```bash
# still inside /api
npm install
npm run dev
```

You should see line like:

```
Database "imy772" created.       (or "already exists")
Database connection established.
Migration 001_create_users completed successfully.
...
Server is running on http://localhost:3000
```

Confirm health : open <http://localhost:3000/health> in a browser. You should see
`{"status":"OK", ...}`.

Leave this running.

### Step 5 : Configure frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env.local
```

Open `frontend/.env.local` and fill in the Cogniro values (the same pool and client ID you
used in the API):

```ini
VITE_COGNITO_USER_POOL_ID=eu-north-1_xxxxxxxxx
VITE_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=your-domain.auth.<region>.amazoncognito.com
VITE_COGNITO_REDIRECT_SIGN_IN=http://localhost:5173/admin/callback
VITE_COGNITO_REDIRECT_SIGN_OUT=http://localhost:5173
```

### Step 6 : Start the frontend

```bash
# inside /frontend
npm install
npm run dev
```

Vite will print a local URL, normally <http://localhost:5173>. Open it. You should land on the
About page.


# Part B : Deploy to a server 

The live system runs on AWS EC2 server. Deployment is auto when pushing to
the main branch, it triggers a GitHub Action.

### One-time server setup

Do this once on a new EC2 Ubuntu instance.

1. Install runtimes:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm postgresql nginx
   sudo npm install -g pm2
   ```

2. Set up PostgreSQL — ensure it is running and note the credentials you will put in
   `api/.env`. (The API auto-creates the database and tables on first run.)

3. Clone the repo into the expected location (the deploy script uses `/home/ubuntu/app`):
   ```bash
   git clone <your-repository-url> /home/ubuntu/app
   cd /home/ubuntu/app
   ```

4. Create the environment files on the server:
   - `api/.env` — same keys as Part A, but with production database credentials and the live
     AWS values.
   - `frontend/.env.production` — already committed with the live values, for example:
     ```ini
     VITE_COGNITO_USER_POOL_ID=eu-north-1_JyZlBmvPY
     VITE_COGNITO_APP_CLIENT_ID=7sa3i8grhkvde9l57nudsmrnp8
     VITE_COGNITO_DOMAIN=eu-north-1jyzlbmvpy.auth.eu-north-1.amazoncognito.com
     VITE_COGNITO_REDIRECT_SIGN_IN=https://<your-host>.nip.io/admin/callback
     VITE_COGNITO_REDIRECT_SIGN_OUT=https://<your-host>.nip.io/about
     VITE_API_URL=https://<your-host>.nip.io
     ```
     Replace `<your-host>` with your EC2 public IP in nip.io form (e.g. `13.60.103.17.nip.io`).

5. Build both apps the first time:
   ```bash
   cd /home/ubuntu/app/api && npm install && npm run build
   cd /home/ubuntu/app/frontend && npm install && npm run build
   ```

6. Start the API under PM2 with the name the deploy script expects (`imy772-api`):
   ```bash
   cd /home/ubuntu/app/api
   pm2 start dist/server.js --name imy772-api
   pm2 save
   pm2 startup        # follow the printed command so PM2 restarts on reboot
   ```

7. Configure Nginx to:
   - serve `frontend/dist` as the website,
   - proxy `/api/` to `http://localhost:3000`,
   - terminate HTTPS (use a certificate for your `*.nip.io` host).

   A minimal server block:
   ```nginx
   server {
     listen 443 ssl;
     server_name <your-host>.nip.io;

     ssl_certificate     /etc/letsencrypt/live/<your-host>.nip.io/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/<your-host>.nip.io/privkey.pem;

     root /home/ubuntu/app/frontend/dist;
     index index.html;

     location /api/ {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header Authorization $http_authorization;
     }

     location / {
       try_files $uri /index.html;   # SPA routing
     }
   }
   ```
   Obtain the TLS certificate with Let's Encrypt (`sudo certbot --nginx`).

### Automated deployments (GitHub Actions)

The workflow at [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on every
push to `main`. It SSHes into the server and runs:

```bash
cd /home/ubuntu/app
git fetch origin && git reset --hard origin/main && git clean -fd
cd api && npm install && npm run build && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 restart imy772-api
```

For this to work, add these GitHub repository secrets
(Settings → Secrets and variables → Actions):

- `EC2_HOST` -  The server's public IP or hostname
- `EC2_USER` - The SSH user (e.g. `ubuntu`)
- `EC2_SSH_KEY` - The private SSH key authorised on the server

After this is set up, deploying is just `git push origin main`.


## Configuring AWS Cognito (admin login)

Login is handled entirely by Cognito's hosted UI. To make it work:

1. In the AWS Console, open Cognito → User Pools and create (or open) a user pool.
2. Note the User Pool ID and create an App client; note its Client ID. Put both in
   `api/.env` and the frontend env file.
3. In the App client's Hosted UI / login pages settings, add your redirect URLs to the
   Allowed callback URLs and Allowed sign-out URLs:
   - Local: `http://localhost:5173/admin/callback` and `http://localhost:5173`
   - Live: `https://<your-host>.nip.io/admin/callback` and `https://<your-host>.nip.io/about`
4. Create a group named `admin` in the user pool. Add a user to that group to give them
   admin rights in EcoMap. (The frontend reads the role from the user's Cognito attributes /
   group; the API reads it from `cognito:groups`.)
5. Create at least one user and set a password so you can sign in.

## Configuring AWS Bedrock (the chatbot)

1. In the AWS Console, open Bedrock and ensure model access is enabled for
   Anthropic Claude Haiku 4.5 in your `AWS_REGION` (the code uses
   `us.anthropic.claude-haiku-4-5-20251001-v1:0`).
2. Create an IAM user/role with permission to call `bedrock:InvokeModel` / the Converse API.
3. Put its `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_REGION` in `api/.env`.

If Bedrock is not configured, the rest of the system still runs — only the AMR Assistant will
return an error when used.

