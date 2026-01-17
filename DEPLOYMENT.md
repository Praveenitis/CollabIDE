# Deployment Guide

This guide covers multiple deployment options for the CollabIDE (Placement Ace) application.

## Prerequisites

- Docker and Docker Compose installed
- A domain name (optional, for production)
- A VPS or cloud server (for self-hosted deployment)

## Option 1: Docker Compose Deployment (Recommended)

The easiest way to deploy is using Docker Compose on a VPS or cloud server.

### Step 1: Prepare Your Server

1. Install Docker and Docker Compose on your server:
   ```bash
   # For Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. Install Docker Compose:
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### Step 2: Clone and Deploy

1. Clone your repository on the server:
   ```bash
   git clone <your-repo-url>
   cd placement-ace-perntainer
   ```

2. (Optional) Create a `.env` file for custom configuration:
   ```env
   REDIS_URL=redis://redis:6379
   PORT=3001
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```

4. Verify the containers are running:
   ```bash
   docker-compose ps
   ```

### Step 3: Configure Nginx Reverse Proxy (Optional)

If you want to use a domain name and HTTPS:

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. Create an Nginx configuration file at `/etc/nginx/sites-available/collabide`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:80;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Enable the site and get SSL certificate:
   ```bash
   sudo ln -s /etc/nginx/sites-available/collabide /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

4. The application will be available at `https://yourdomain.com`

## Option 2: Deploy to Cloud Platforms

### Deploy to Railway

1. Sign up at [Railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Railway will automatically detect the `docker-compose.yml` file
4. Add environment variables in the Railway dashboard:
   - `NODE_ENV=production`
   - `REDIS_URL=redis://redis:6379`
5. Deploy and Railway will provide you with a URL

### Deploy to Render

1. Sign up at [Render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Use the following settings:
   - **Build Command**: `docker-compose build`
   - **Start Command**: `docker-compose up`
   - **Environment**: Docker
5. Add environment variables in the Render dashboard
6. Deploy

### Deploy to DigitalOcean App Platform

1. Sign up at [DigitalOcean](https://www.digitalocean.com)
2. Create a new App and connect your repository
3. DigitalOcean will detect the Docker setup
4. Configure environment variables
5. Deploy

### Deploy to AWS (ECS/Fargate)

1. Install AWS CLI and configure credentials
2. Create an ECR repository:
   ```bash
   aws ecr create-repository --repository-name collabide
   ```
3. Build and push images:
   ```bash
   docker-compose build
   docker tag placement-ace-perntainer_frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/collabide:frontend
   docker tag placement-ace-perntainer_backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/collabide:backend
   aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/collabide:frontend
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/collabide:backend
   ```
4. Create ECS task definition and service using the AWS Console

## Option 3: Separate Frontend and Backend Deployment

If you prefer to deploy frontend and backend separately:

### Frontend (Static Hosting)

The frontend can be deployed to:
- **Vercel**: `vercel --prod`
- **Netlify**: Connect GitHub repo and set build command to `npm run build`
- **Cloudflare Pages**: Connect repo and set build command to `npm run build`

### Backend Deployment

1. Deploy backend to platforms that support Node.js:
   - **Heroku**: `git push heroku main`
   - **Railway**: Deploy separately with Node.js environment
   - **Fly.io**: Use `fly launch`

2. Update frontend socket configuration in `src/lib/socket.ts` to point to your backend URL:
   ```typescript
   export const socket: Socket = io('https://your-backend-url.com', {
     autoConnect: false,
     transports: ['websocket', 'polling']
   });
   ```

3. Deploy Redis separately:
   - **Redis Cloud** (free tier available)
   - **Upstash** (serverless Redis)
   - **AWS ElastiCache**
   - Or use Redis container on your VPS

## Environment Variables

Create a `.env` file in the project root with:

```env
# Backend Configuration
PORT=3001
NODE_ENV=production

# Redis Configuration
REDIS_URL=redis://redis:6379

# CORS Configuration (optional, defaults to "*")
FRONTEND_URL=https://yourdomain.com

# For production deployments with separate frontend/backend
# BACKEND_URL=https://api.yourdomain.com
```

## Health Checks

- Frontend: `http://your-domain/` (should serve the React app)
- Backend API: `http://your-domain/api/sessions` (should return JSON)
- Socket.io: `http://your-domain/socket.io/` (WebSocket connection)

## Troubleshooting

### Containers won't start
```bash
# Check logs
docker-compose logs

# Check specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs redis
```

### Port conflicts
If port 80 is already in use:
1. Change the port mapping in `docker-compose.yml`:
   ```yaml
   frontend:
     ports:
       - "8080:80"  # Change 80 to 8080 or another port
   ```

### Redis connection issues
- Ensure Redis container is running: `docker-compose ps redis`
- Check Redis logs: `docker-compose logs redis`
- Verify `REDIS_URL` environment variable is correct

### Socket.io connection issues
- Check CORS configuration in `server/index.js`
- Verify nginx proxy configuration for `/socket.io/` path
- Check browser console for WebSocket errors

## Maintenance

### Update the application
```bash
git pull
docker-compose up -d --build
```

### View logs
```bash
docker-compose logs -f
```

### Stop the application
```bash
docker-compose down
```

### Stop and remove volumes (clears Redis data)
```bash
docker-compose down -v
```

## Security Considerations

1. **Use HTTPS**: Always use SSL/TLS in production (Let's Encrypt is free)
2. **Environment Variables**: Never commit `.env` files to git
3. **Firewall**: Restrict access to only necessary ports (80, 443)
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **Redis Security**: Use Redis AUTH if exposing Redis externally

## Monitoring

Consider adding monitoring:
- **Application**: Use services like Sentry for error tracking
- **Infrastructure**: Use Docker stats: `docker stats`
- **Logs**: Consider centralized logging (e.g., ELK stack, Loki)

## Support

For issues or questions, refer to the main [README.md](./README.md) or open an issue in the repository.

