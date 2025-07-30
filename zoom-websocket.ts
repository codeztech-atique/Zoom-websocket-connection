import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Use require so WebSocket is the real constructor
const WebSocket = require('ws');

const {
  SUBSCRIPTION_ID,
  ACCOUNT_ID,
  CLIENT_ID,
  CLIENT_SECRET,
} = process.env as { [key: string]: string };

if (!SUBSCRIPTION_ID || !ACCOUNT_ID || !CLIENT_ID || !CLIENT_SECRET) {
  throw new Error(
    'Missing one of ZOOM env vars: SUBSCRIPTION_ID, ACCOUNT_ID, CLIENT_ID, CLIENT_SECRET'
  );
}

const OAUTH_URL = 'https://zoom.us/oauth/token';
const WS_BASE   = 'wss://ws.zoom.us/ws';
let heartbeatTimer: NodeJS.Timeout;

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const resp = await axios.post(
    `${OAUTH_URL}?grant_type=account_credentials&account_id=${ACCOUNT_ID}`,
    null,
    { headers: { Authorization: `Basic ${creds}` } }
  );
  return resp.data.access_token;
}

async function connectZoom() {
  try {
    const token = await getAccessToken();
    const url = `${WS_BASE}?subscriptionId=${SUBSCRIPTION_ID}&access_token=${token}`;
    console.log('🔗 Connecting to', url);

    const ws = new WebSocket(url);

    ws.on('open', () => {
      console.log('✅ WebSocket OPEN');

      // send a JSON “heartbeat” every 10s
      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ module: 'heartbeat' }));
          console.log('❤️ heartbeat sent');
        }
      }, 10_000);
    });

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.module === 'heartbeat_response') {
          console.log('💓 heartbeat received');
        } else {
          console.log('📨', msg);
        }
      } catch {
        // non-JSON or unexpected payload
        console.log('📨 raw:', data.toString());
      }
    });

    ws.on('error', (err: Error) => {
      console.error('⚠️ WebSocket ERROR', err);
      ws.close();
    });

    ws.on('close', (code: number, reason: Buffer) => {
      console.warn(`❌ CLOSED ${code} — ${reason.toString()}`);
      clearInterval(heartbeatTimer);
      setTimeout(connectZoom, 5_000);
    });
  } catch (err) {
    console.error('🔄 retrying after error', err);
    setTimeout(connectZoom, 5_000);
  }
}

connectZoom();
