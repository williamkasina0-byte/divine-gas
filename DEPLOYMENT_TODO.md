put # Divine Gas Deployment TODO

## Step 1: Pre-Deployment Verification
- [ ] Test backend locally on port 3002
- [ ] Test frontend locally on port 3000
- [ ] Verify API connectivity

## Step 2: GitHub Repository Setup ✅ COMPLETE
- [x] Initialize Git repository
- [x] Create .gitignore for node_modules and .env files
- [x] Commit all changes
- [x] Push to GitHub repository

**Repository:** https://github.com/williamkasina0-byte/divine-gas


## Step 3: Backend Deployment (Render) - IN PROGRESS
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repo: `williamkasina0-byte/divine-gas`
- [ ] Configure:
  - Name: `divine-gas-backend`
  - Region: Oregon (or closest)
  - Branch: `main`
  - Build Command: `cd backend; npm install`
  - Start Command: `cd backend; npm start`
- [ ] Add PostgreSQL database (Free tier)
- [ ] Configure environment variables:
  - `NODE_ENV=production`
  - `PORT=3002`
  - `JWT_SECRET` (generate random string)
  - `DATABASE_URL` (auto-populated from PostgreSQL)
- [ ] Deploy and verify health check: `https://divine-gas-backend.onrender.com/api/health`


## Step 4: Frontend Deployment (Vercel) - PENDING
- [ ] Go to https://vercel.com
- [ ] Click "Add New Project"
- [ ] Import GitHub repo: `williamkasina0-byte/divine-gas`
- [ ] Configure:
  - Framework Preset: Vite
  - Build Command: `vite build`
  - Output Directory: `dist`
- [ ] Add Environment Variable:
  - `VITE_API_URL=https://divine-gas-backend.onrender.com`
- [ ] Deploy frontend


## Step 5: Post-Deployment Testing
- [ ] Test login functionality
- [ ] Test product listing
- [ ] Test order placement
- [ ] Verify admin portal access
