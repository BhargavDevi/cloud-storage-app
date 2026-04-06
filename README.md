# CloudVault — Cloud-Based File Storage Solution

A simple, production-deployed web application for uploading, sharing, and downloading files via unique access codes. Built with Node.js and Express, deployed on AWS EC2.

---

## Live Deployment

- **Platform**: AWS EC2 — Asia Pacific (Mumbai)
- **Instance**: t3.micro, Ubuntu Server 22.04 LTS
- **Process Manager**: PM2
- **Access**: `http://3.110.190.132:3000/`[Currently the instence is off]

---

## Features

- Upload images (JPG, PNG, GIF, WEBP) and PDF files up to 10MB
- Each uploaded file receives a unique 5-character share code
- Any user with a valid code can access and download the corresponding file
- Files are stored persistently on the EC2 server
- Code-to-file mappings are stored in `codes.json`

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Backend    | Node.js, Express        |
| File Upload| Multer                  |
| Frontend   | HTML, CSS, JavaScript   |
| Deployment | AWS EC2 (Ubuntu)        |
| Process    | PM2                     |
| Version Control | Git, GitHub        |

---

## Project Structure

```
cloud-storage-app/
├── server.js          # Express server and API routes
├── codes.json         # Share code to file mapping (auto-generated)
├── package.json       # Project dependencies
├── .gitignore         # Excludes node_modules, uploads, .pem files
├── uploads/           # Uploaded files stored here (not tracked by Git)
│   └── .gitkeep
└── public/
    └── index.html     # Frontend interface
```

---

## API Endpoints

| Method | Endpoint               | Description                        |
|--------|------------------------|------------------------------------|
| POST   | `/upload`              | Upload a file, returns share code  |
| GET    | `/files`               | List all uploaded files with codes |
| GET    | `/access/:code`        | Look up a file by share code       |
| GET    | `/download/:filename`  | Download a file by filename        |
| DELETE | `/file/:code`          | Delete a file by share code        |

---

## Local Development

**Prerequisites**: Node.js v18+, npm

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cloud-storage-app.git
cd cloud-storage-app

# Install dependencies
npm install

# Start the server
node server.js

# Visit
http://localhost:3000
```

---

## AWS EC2 Deployment

### 1. Launch Instance
- AMI: Ubuntu Server 22.04 LTS
- Instance type: t3.micro
- Security group inbound rules: ports 22, 80, 3000

### 2. Connect via SSH
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 3. Install Node.js
```bash
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

### 4. Deploy the App
```bash
git clone https://github.com/YOUR_USERNAME/cloud-storage-app.git
cd cloud-storage-app
npm install
```

### 5. Start with PM2
```bash
sudo npm install -g pm2
pm2 start server.js --name cloud-storage
pm2 startup
pm2 save
```

---

## Updating the Deployment

```bash
# On local machine
git add .
git commit -m "your message"
git push

# On EC2
cd ~/cloud-storage-app
git pull
pm2 restart cloud-storage
```

---

## Monitoring Uploaded Files

```bash
# List all uploaded files
ls -lh ~/cloud-storage-app/uploads

# Watch files appear in real time
watch -n 1 ls -lh ~/cloud-storage-app/uploads

# View all share codes and file mappings
cat ~/cloud-storage-app/codes.json

# Count total uploaded files
ls ~/cloud-storage-app/uploads | wc -l

# Check total storage used
du -sh ~/cloud-storage-app/uploads
```

---

## PM2 Commands

```bash
pm2 list                        # View running processes
pm2 logs cloud-storage          # View live logs
pm2 restart cloud-storage       # Restart after update
pm2 stop cloud-storage          # Stop the app
pm2 monit                       # Real-time monitoring dashboard
```

---

## Environment

| Setting       | Value              |
|---------------|--------------------|
| Port          | 3000               |
| Max file size | 10MB               |
| Allowed types | JPG, PNG, GIF, WEBP, PDF |
| Storage       | Local filesystem (`/uploads`) |
| Code length   | 5 characters       |

---

## Author

Bhargav — Full Stack & Cloud Deployment Project