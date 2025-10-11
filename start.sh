#!/bin/bash

# Simple startup script for Railway
echo " Starting NTC Bus Tracker API..."

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-3000}

# Start the server with node directly
exec node server.js