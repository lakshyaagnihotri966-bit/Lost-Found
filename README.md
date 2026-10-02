# MPGI Campus Lost & Found

React (Vite) + Express + MongoDB. Report → Search → Match → Claim → Verify → Recover.

## Setup

1. **Server**
   ```
   cd server
   cp .env.example .env     # fill MONGO_URI and JWT_SECRET (Cloudinary + Gmail optional)
   npm install
   npm run seed             # optional: test accounts + sample items
   npm run dev              # http://localhost:5000
   ```
2. **Client** (second terminal)
   ```
   cd client
   npm install
   npm run dev              # http://localhost:5173
   ```

## Environment variables (server/.env)
| Name | Required | Notes |
|---|---|---|
| MONGO_URI | yes | MongoDB Atlas connection string |
| JWT_SECRET | yes | any long random string |
| CLIENT_URL | yes | frontend URL; used for CORS, QR codes and email links |
| SERVER_URL | for local images | public URL of this API |
| ADMIN_EMAIL | no | whoever registers with this email becomes admin |
| CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET | no | if blank, images are saved to server/uploads |
| GMAIL_USER / GMAIL_APP_PASSWORD | no | if blank, only in-app notifications are sent. Use a Google App Password (2-step verification must be on) |

Client: `VITE_API_URL` is only needed in production if the API is on a different domain.

## Test accounts (after `npm run seed`)
- Admin: admin@mpgi.edu / Admin@123
- Student: rahul@mpgi.edu / Student@123
- Student: priya@mpgi.edu / Student@123

Rahul's lost "Dell laptop bag" and Priya's found "Dell backpack" are seeded as a match.

## Smart matching
`server/utils/match.js`. Weighted score out of 100: name/keywords 35, category 20, colour 15, brand 10, location 10, date 10.
Colour and brand are skipped if either side leaves them blank. Matches of 50% or more are saved and both owners are notified.

## Notifications
Every in-app notification is also emailed when Gmail is configured: new match, claim received, claim approved/rejected, item recovered, listing removed, and report reviewed.

## Deploying
1. Database: MongoDB Atlas. In Atlas, Network Access, allow `0.0.0.0/0` (or your host's IPs) so the hosted server can connect.
2. Server (Render/Railway): root directory `server`, build `npm install`, start `npm start`. Set every variable from the table above in the host's dashboard. Do not upload `.env`.
3. Client (Vercel/Netlify): root directory `client`, build `npm run build`, output `dist`. Set `VITE_API_URL=https://<your-api-host>/api`.
4. On the server, set `CLIENT_URL` to the deployed client URL (needed for CORS, QR codes and email links).
5. Images: keep Cloudinary configured in production, because local `server/uploads` is wiped on restart.

## Security
`server/.env` holds secrets (Atlas password, Cloudinary secret, Gmail App Password). Never commit or share it. If any of these were pasted into a chat, rotate them before going live.
