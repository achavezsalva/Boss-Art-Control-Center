# BOSS ART Control Center - Production Deployment Guide

BOSS ART Control Center is a production-ready self-hosted deployment platform. Follow these steps to deploy it on a fresh Ubuntu server.

## 1. Prerequisites

- Ubuntu 22.04 LTS or newer
- Node.js 20+
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- Git

## 2. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

## 3. Application Deployment

```bash
# Clone the repository
git clone <your-repo-url> artchie
cd artchie

# Install dependencies
npm install

# Build the application
npm run build

# Start with PM2
pm2 start dist/server.cjs --name artchie-control-center
pm2 save
pm2 startup
```

## 4. Nginx Configuration

Create a file at `/etc/nginx/sites-available/artchie.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/artchie.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_google_ai_key
```

## 6. Accessing the Dashboard

Default credentials:
- **Email:** admin@artchie.local
- **Password:** admin123

## Security Recommendations

1. **Firewall:** Enable `ufw` and only allow ports 80, 443, and 22.
2. **SSL:** Use Certbot (`sudo snap install --classic certbot`) to enable HTTPS.
3. **Fail2Ban:** Install fail2ban to protect against brute-force attacks on SSH and Login APIs.
