# MongoDB Setup Guide

## Prerequisites

1. **Install MongoDB** on your system:
   - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - **macOS**: `brew install mongodb-community`
   - **Linux**: Follow [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/administration/install-on-linux/)

## Setup Steps

### 1. Start MongoDB Service

**Windows:**
```bash
# MongoDB usually starts automatically as a Windows service
# If not, start it manually:
net start MongoDB
```

**macOS (using Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
# To start on boot:
sudo systemctl enable mongod
```

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh
# or
mongo

# If successful, you'll see the MongoDB shell
```

### 3. Create Environment File

Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

Edit `.env` if needed:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/winqroo
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. (Optional) Seed Initial Data

```bash
node scripts/seedData.js
```

This will create:
- Demo shop owner account
- Demo customer accounts
- Sample services
- A shop with services

### 6. Start the Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
   Database: winqroo
Server is running on port 5000
```

## Troubleshooting

### MongoDB Not Starting

**Windows:**
- Check if MongoDB service is running: `services.msc`
- Check MongoDB logs: `C:\Program Files\MongoDB\Server\<version>\log\mongod.log`

**macOS/Linux:**
- Check MongoDB status: `brew services list` (macOS) or `sudo systemctl status mongod` (Linux)
- Check logs: `/usr/local/var/log/mongodb/mongo.log` (macOS) or `/var/log/mongodb/mongod.log` (Linux)

### Connection Refused

- Make sure MongoDB is running
- Check if port 27017 is not blocked by firewall
- Verify the connection string in `.env` file

### Authentication Errors

If you've set up MongoDB with authentication, update the connection string:
```env
MONGODB_URI=mongodb://username:password@localhost:27017/winqroo
```

## MongoDB Compass (GUI)

For a visual interface to view your data:
- Download [MongoDB Compass](https://www.mongodb.com/products/compass)
- Connect using: `mongodb://localhost:27017`

## Cloud MongoDB (Alternative)

You can also use MongoDB Atlas (cloud):
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Get connection string
4. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/winqroo
```

