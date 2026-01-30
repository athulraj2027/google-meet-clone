# Video Conference Platform (Mediasoup + Next.js)

A production-grade video conferencing platform built using Mediasoup, WebRTC, and Next.js App Router.
This project demonstrates real-time communication at the system level without relying on third-party video SDKs.

The focus is on owning the media pipeline end-to-end, including signaling, transport management, and RTP flow.

 Features

### Core Video Conferencing

* Real-time audio and video streaming using WebRTC
* Multi-participant room support
* Dynamic participant join and leave handling
* Producer and consumer lifecycle management
* NAT-aware media routing

### Backend (Mediasoup)

* Mediasoup worker and router initialization
* WebRTC transport creation and management
* RTP capabilities negotiation
* Producer and consumer orchestration
* Socket-based signaling
* ANNOUNCED_IP support for cloud deployments

### Frontend (Next.js)

* Next.js 13+ App Router
* Client-side rendering for RTC pages
* Room routing via query parameters
* Clean separation of server and client components
* Build-safe configuration for Vercel

### Infrastructure and Deployment

* AWS EC2 deployment
* Nginx reverse proxy
* HTTPS using Let’s Encrypt (Certbot)
* Subdomain-based routing
* Production-ready setup

---

## Tech Stack

### Frontend

* Next.js (App Router)
* React
* TypeScript
* WebRTC APIs

### Backend

* Node.js
* Mediasoup
* Socket.IO
* TypeScript

### Infrastructure

* AWS EC2 (Amazon Linux)
* Nginx
* Certbot (Let’s Encrypt)
* PM2 or systemd (optional)

---





## Environment Variables

### Backend (.env)

```env
PORT=4000
ANNOUNCED_IP=PUBLIC_EC2_IP
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_SOCKET_URL=https://video-conference.socket.yourdomain.com
```

---

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend server runs on:

```
http://localhost:4000
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

## Production Deployment (AWS EC2)

### 1. Open required ports

* 80 (HTTP)
* 443 (HTTPS)
* 4000 (Mediasoup signaling)
* Required UDP ports for WebRTC media

### 2. Configure Nginx

* Reverse proxy traffic to the Mediasoup server
* Terminate HTTPS at Nginx
* Route subdomains to backend services

### 3. SSL Certificate

```bash
sudo certbot --nginx -d video-conference.socket.yourdomain.com
```

### 4. Start the backend

```bash
PORT=4000 ANNOUNCED_IP=PUBLIC_IP npm run dev
```

## Architectural Notes

* No third-party RTC APIs are used
* Full control over:

  * Media routing
  * Transport lifecycle
  * Bandwidth management
* ANNOUNCED_IP ensures correct ICE candidate resolution behind NAT
* RTC pages are rendered client-side to avoid SSR issues with WebRTC


## Known Limitations

* No recording support
* No TURN server configured (recommended for production)
* Minimal UI by design to focus on RTC architecture


## Why This Project

This project demonstrates:

* Deep WebRTC understanding
* Mediasoup internals
* Cloud-safe RTC deployment
* Real-world system design for video applications

It is suitable for:

* Real-time communication startups
* Video conferencing platforms
* Media streaming companies
* Senior frontend or backend engineering roles


## License

MIT License
