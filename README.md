# Wake On LAN Manager
[中文文档](README.zh.md)

A Flask-based web application for managing and monitoring Wake-on-LAN enabled devices on your local network.

## Features

- Add and manage network devices
- Send Wake-on-LAN magic packets to wake up devices
- Real-time device status monitoring
- Edit device information
- Delete devices
- Beautiful responsive web interface
- SQLite database for device information storage

## Tech Stack

- Backend: Flask + SQLAlchemy
- Frontend: Bootstrap 5 + SweetAlert2
- Database: SQLite
- Containerization: Docker + Docker Compose

## Installation

1. Create virtual environment (optional):
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Access the application:
Open your browser and visit http://localhost:8088

## Docker Deployment

1. Start the application using Docker Compose:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop the application:
```bash
docker-compose down
```

### Docker Notes

- Application runs in host network mode, which is required for Wake-on-LAN functionality
- Database files are stored in the ./data directory
- Container auto-restarts (unless manually stopped)
- Uses gunicorn as the production server
- Default port: 8088

## Usage Guide

1. Add Device:
   - Click the "Add Device" button
   - Fill in the device information in the popup form
   - Click "Save"

2. Device Management:
   - Wake Device: Click the "Wake Device" button on the device card
   - Check Status: Click the "Update Status" button
   - Edit Information: Click the "Edit Device" button
   - Delete Device: Click the "Delete Item" button (confirmation required)

## Important Notes

- Ensure target devices are properly configured for Wake-on-LAN
- Make sure you're operating within the same local network
- MAC address format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
- IP address must be a valid IPv4 address
- Broadcast address is automatically calculated based on IP address (default subnet mask: 255.255.255.0). Currently, packets are sent to the IP address directly, so the broadcast address is not being used.
