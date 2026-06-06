import 'dotenv/config'
import type { RtpCodecCapability, TransportListenIp } from 'mediasoup/node/lib/types'

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export const PORT = parseInt(process.env.PORT ?? '3001', 10)
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000'
export const MAX_PEERS_PER_ROOM = 5

// ---------------------------------------------------------------------------
// WebRTC / ICE
// ---------------------------------------------------------------------------

const announcedIp = process.env.ANNOUNCED_IP ?? undefined

export const listenIps: TransportListenIp[] = [
  {
    ip: '0.0.0.0',
    announcedIp,
  },
]

export const iceServers = [
  { urls: process.env.STUN_URL ?? 'stun:stun.l.google.com:19302' },
  ...(process.env.TURN_URL
    ? [
        {
          urls: process.env.TURN_URL,
          username: process.env.TURN_USERNAME ?? '',
          credential: process.env.TURN_CREDENTIAL ?? '',
        },
      ]
    : []),
]

// ---------------------------------------------------------------------------
// Mediasoup Worker
// ---------------------------------------------------------------------------

export const workerSettings = {
  rtcMinPort: 40000,
  rtcMaxPort: 49999,
  logLevel: 'warn' as const,
  logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as const,
}

// ---------------------------------------------------------------------------
// Router media codecs
// ---------------------------------------------------------------------------

export const mediaCodecs: RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {},
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
    },
  },
]

// ---------------------------------------------------------------------------
// WebRtcTransport options
// ---------------------------------------------------------------------------

export const webRtcTransportOptions = {
  listenIps,
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  initialAvailableOutgoingBitrate: 800_000,
  minimumAvailableOutgoingBitrate: 100_000,
  maxSctpMessageSize: 262144,
}
