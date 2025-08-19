# 🚀 Production Deployment Guide

Deploy your PDF-QA application with frontend on Vercel and backend on Render.

## 📋 Prerequisites

- GitHub repository: `namithm70/Aiweb1` (✅ Already done)
- Gemini API key: `AIzaSyBlleLp9VP938yWNY_DIlwCbej6u2eQ_ZE` (✅ Already have)
- Vercel account
- Render account

---

## 🔧 **STEP 1: Deploy Backend on Render**

### 1.1 Create Render Account
1. Go to **[https://render.com](https://render.com)**
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account**

### 1.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Connect your GitHub account if prompted
4. Select repository: **`namithm70/Aiweb1`**
5. Click **"Connect"**

### 1.3 Configure Service Settings

**Basic Info:**
- **Name**: `pdf-qa-backend`
- **Region**: `Oregon (US West)` or closest to your users
- **Branch**: `main`
- **Root Directory**: **Leave EMPTY** (uses root-level Dockerfile)

**Build & Deploy:**
- **Runtime**: `Docker` (Recommended) OR `Python 3`
- **Build Command**: *(Leave empty for Docker)* OR `pip install -r backend/requirements.txt`
- **Start Command**: *(Leave empty for Docker)* OR `python backend/gemini_main.py`

### 1.4 Environment Variables
Click **"Advanced"** and add these environment variables:

```
GEMINI_API_KEY=AIzaSyBlleLp9VP938yWNY_DIlwCbej6u2eQ_ZE
SECRET_KEY=pdf_qa_super_secret_production_key_12345
UPLOAD_DIR=/opt/render/project/src/uploads
MAX_FILE_SIZE_MB=50
DEBUG=false
LOG_LEVEL=INFO
```

### 1.5 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. **Copy your backend URL**: `https://pdf-qa-backend-xxxx.onrender.com`

---

## 🌐 **STEP 2: Deploy Frontend on Vercel**

### 2.1 Create Vercel Account
1. Go to **[https://vercel.com](https://vercel.com)**
2. Click **"Start Deploying"**
3. Sign up with your **GitHub account**

### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Find repository: **`namithm70/Aiweb1`**
3. Click **"Import"**

### 2.3 Configure Project Settings
1. **Framework Preset**: `Next.js` (auto-detected)
2. **Root Directory**: Click **"Edit"** → Select `frontend`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `.next` (auto-detected)

### 2.4 Environment Variables
Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL=https://pdf-qa-backend-xxxx.onrender.com
```
*(Replace `xxxx` with your actual Render URL)*

### 2.5 Deploy Frontend
1. Click **"Deploy"**
2. Wait for deployment (2-5 minutes)
3. **Copy your frontend URL**: `https://aiweb1-xxxx.vercel.app`

---

## 🔗 **STEP 3: Connect Frontend & Backend**

### 3.1 Update Backend CORS Settings

The backend needs to allow your Vercel frontend URL. Update the CORS origins in your Render environment variables:

**Add this environment variable on Render:**
```
CORS_ORIGINS=https://aiweb1-xxxx.vercel.app,http://localhost:3000
```
*(Replace with your actual Vercel URL)*

### 3.2 Redeploy Backend
1. In your Render dashboard, click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for redeployment

---

## ✅ **STEP 4: Test Your Production App**

### 4.1 Access Your App
Visit your Vercel URL: **`https://aiweb1-xxxx.vercel.app`**

### 4.2 Test Features
1. **Login**: Use `admin@example.com` / `admin123`
2. **Upload PDF**: Test document upload
3. **Ask Questions**: Test AI question answering
4. **Check Console**: Verify no CORS errors

---

## 🐛 **Troubleshooting**

### Backend Issues
- **Build fails**: Check Render logs for Python errors
- **API not responding**: Verify environment variables
- **CORS errors**: Update CORS_ORIGINS with your Vercel URL

### Frontend Issues  
- **Build fails**: Check build logs in Vercel
- **API connection fails**: Verify NEXT_PUBLIC_API_URL points to Render
- **Environment variables**: Redeploy after adding variables

### Common Fixes
1. **Redeploy both services** after any configuration changes
2. **Check logs** in both Render and Vercel dashboards
3. **Verify URLs** are correct and accessible

---

## 📊 **Production Monitoring**

### Render Dashboard
- Monitor backend performance and logs
- Check resource usage
- View deployment history

### Vercel Dashboard  
- Monitor frontend performance
- Check build logs
- View analytics

---

## 🎉 **Success!**

Your PDF-QA application is now live in production:

- **Frontend**: `https://aiweb1-xxxx.vercel.app`
- **Backend**: `https://pdf-qa-backend-xxxx.onrender.com`  
- **Features**: Full PDF upload, AI questioning, and real-time chat
- **Powered by**: Gemini AI, Next.js, and FastAPI

**Share your app with others and start analyzing PDFs with AI!** 🚀
