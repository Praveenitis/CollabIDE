# Fix for Render Deployment Error

## The Problem
You're seeing: `host not found in upstream "backend"` because Render's docker-compose networking doesn't automatically resolve service names like local Docker Compose does.

## Solution 1: Use render.yaml (Recommended)

I've created a `render.yaml` file that properly configures all services. Follow these steps:

1. **In your Render dashboard:**
   - Go to your service settings
   - Delete the current service (or services)
   - Create a new "Blueprint" from your GitHub repo
   - Render will automatically detect `render.yaml` and deploy all services correctly

2. **Or deploy manually:**
   - Create a new "Web Service" for backend
   - Create a new "Web Service" for frontend  
   - Create a new "Redis" service
   - Use the service URLs for configuration

## Solution 2: Fix Environment Variables

If you want to keep using docker-compose deployment:

1. **In your Render dashboard**, go to your frontend service settings
2. **Add Environment Variables:**
   - `BACKEND_HOST=localhost` (if services share network)
   - OR `BACKEND_HOST=<your-backend-service-url>` (without https://)
   - `BACKEND_PORT=3001`

**However**, for docker-compose, try using the service name:
- `BACKEND_HOST=backend`
- `BACKEND_PORT=3001`

## Solution 3: Deploy Services Separately (Easiest)

This is the most reliable approach for Render:

### Step 1: Deploy Backend
1. New → Web Service
2. Connect GitHub repo
3. Settings:
   - **Name**: `collabide-backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `server/Dockerfile`
   - **Docker Context**: `.`
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `REDIS_URL=redis://redis:6379` (we'll update this)

### Step 2: Deploy Redis
1. New → Redis
2. **Name**: `collabide-redis`
3. **Plan**: Free
4. Copy the **Internal Redis URL** (looks like: `redis://red-xxxxx:6379`)

### Step 3: Update Backend Redis URL
1. Go back to backend service settings
2. Update `REDIS_URL` environment variable to the Redis internal URL you copied

### Step 4: Deploy Frontend
1. New → Web Service
2. Connect GitHub repo  
3. Settings:
   - **Name**: `collabide-frontend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Context**: `.`
4. **Important**: Add environment variables:
   - `BACKEND_HOST=<your-backend-url.onrender.com>` (without https://)
   - OR if using internal networking: `BACKEND_HOST=collabide-backend`
   - `BACKEND_PORT=443` (Render uses HTTPS internally)

### Step 5: Connect Services
1. In frontend service settings, go to "Connections"
2. Connect it to `collabide-backend` service
3. This allows them to communicate internally

## Quick Fix for Current Deployment

If you want a quick fix for your current setup:

1. **In Render dashboard**, find your frontend service
2. **Go to Settings → Environment**
3. **Add these variables:**
   ```
   BACKEND_HOST=backend
   BACKEND_PORT=3001
   ```
4. **Redeploy** the service

If that doesn't work, try:
```
BACKEND_HOST=<your-backend-service-name>
BACKEND_PORT=3001
```

## What I Changed

I've updated your project to support environment variables:

1. **nginx.conf.template** - Template that uses `${BACKEND_HOST}` and `${BACKEND_PORT}`
2. **docker-entrypoint.sh** - Script that replaces placeholders at startup
3. **Dockerfile** - Updated to use the entrypoint script

The frontend will now use whatever `BACKEND_HOST` and `BACKEND_PORT` you set in Render's environment variables.

## Recommended Approach

**For beginners**, I recommend **Solution 3** (deploy services separately):
- More reliable on Render
- Better control over each service
- Easier to debug
- Each service can scale independently

The `render.yaml` I created helps, but Render's docker-compose support can be finicky. Separate services are more stable.

## Need Help?

If you're still getting errors:
1. Check the service logs in Render dashboard
2. Verify environment variables are set correctly
3. Make sure backend is running before frontend
4. Check that Redis is connected to backend

Let me know if you need more help! 🚀
