"use client"

import { useEffect, useRef, useCallback, useReducer } from "react"
import { io, Socket } from "socket.io-client"
import { Device } from "mediasoup-client"
import type { Transport, Producer, Consumer } from "mediasoup-client/lib/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RemotePeer {
  peerId: string
  displayName: string
  videoStream?: MediaStream
  audioStream?: MediaStream
}

export type RoomStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

interface State {
  status: RoomStatus
  error: string | null
  peers: Map<string, RemotePeer>
  localStream: MediaStream | null
  isMicMuted: boolean
  isCamOff: boolean
}

type Action =
  | { type: "CONNECTING" }
  | { type: "CONNECTED"; localStream: MediaStream }
  | { type: "ERROR"; error: string }
  | { type: "DISCONNECTED" }
  | { type: "PEER_STREAM"; peerId: string; displayName: string; kind: "video" | "audio"; stream: MediaStream }
  | { type: "PEER_LEFT"; peerId: string }
  | { type: "TOGGLE_MIC"; isMuted: boolean }
  | { type: "TOGGLE_CAM"; isOff: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CONNECTING":
      return { ...state, status: "connecting", error: null }
    case "CONNECTED":
      return { ...state, status: "connected", localStream: action.localStream }
    case "ERROR":
      return { ...state, status: "error", error: action.error }
    case "DISCONNECTED":
      return { ...state, status: "disconnected", localStream: null, peers: new Map() }
    case "PEER_STREAM": {
      const peers = new Map(state.peers)
      const existing = peers.get(action.peerId) ?? { peerId: action.peerId, displayName: action.displayName }
      peers.set(action.peerId, {
        ...existing,
        ...(action.kind === "video" ? { videoStream: action.stream } : { audioStream: action.stream }),
      })
      return { ...state, peers }
    }
    case "PEER_LEFT": {
      const peers = new Map(state.peers)
      peers.delete(action.peerId)
      return { ...state, peers }
    }
    case "TOGGLE_MIC":
      return { ...state, isMicMuted: action.isMuted }
    case "TOGGLE_CAM":
      return { ...state, isCamOff: action.isOff }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERVER_URL =
  process.env.NEXT_PUBLIC_MEDIASOUP_URL ?? "http://localhost:3001"

function generatePeerId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMediasoup(roomId: string, displayName: string, create = false) {
  const [state, dispatch] = useReducer(reducer, {
    status: "idle",
    error: null,
    peers: new Map(),
    localStream: null,
    isMicMuted: false,
    isCamOff: false,
  })

  const socketRef = useRef<Socket | null>(null)
  const deviceRef = useRef<Device | null>(null)
  const sendTransportRef = useRef<Transport | null>(null)
  const recvTransportRef = useRef<Transport | null>(null)
  const peerId = useRef<string>(generatePeerId())
  const localStreamRef = useRef<MediaStream | null>(null)
  const videoProducerRef = useRef<Producer | null>(null)
  const audioProducerRef = useRef<Producer | null>(null)
  // consumerId -> Consumer
  const consumersRef = useRef<Map<string, Consumer>>(new Map())

  // -------------------------------------------------------------------------
  // consume a remote producer
  // -------------------------------------------------------------------------
  const consumeProducer = useCallback(
    async (
      remotePeerId: string,
      displayName: string,
      producerId: string,
      kind: "audio" | "video",
    ) => {
      const socket = socketRef.current
      const device = deviceRef.current
      const recvTransport = recvTransportRef.current
      if (!socket || !device || !recvTransport) return

      socket.emit(
        "consume",
        {
          roomId,
          peerId: peerId.current,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
        },
        async (error: string | null, data: {
          consumerId: string
          producerId: string
          kind: string
          rtpParameters: object
          producerPaused: boolean
          appData: Record<string, unknown>
        } | undefined) => {
          if (error || !data) {
            console.error("[useMediasoup] consume error:", error)
            return
          }

          const consumer = await recvTransport.consume({
            id: data.consumerId,
            producerId: data.producerId,
            kind: data.kind as "audio" | "video",
            rtpParameters: data.rtpParameters as RTCRtpParameters,
          })

          consumersRef.current.set(consumer.id, consumer)

          const stream = new MediaStream([consumer.track])

          dispatch({
            type: "PEER_STREAM",
            peerId: remotePeerId,
            displayName,
            kind,
            stream,
          })

          // Resume consumer so it actually flows
          socket.emit(
            "resumeConsumer",
            { roomId, peerId: peerId.current, consumerId: consumer.id },
            (err: string | null) => {
              if (err) console.error("[useMediasoup] resumeConsumer error:", err)
            },
          )
        },
      )
    },
    [roomId],
  )

  // -------------------------------------------------------------------------
  // Create send/recv transports and start producing
  // -------------------------------------------------------------------------
  const setupTransports = useCallback(
    async (
      socket: Socket,
      device: Device,
      localStream: MediaStream,
      existingPeers: Array<{
        peerId: string
        displayName: string
        producers: { producerId: string; kind: string }[]
      }>,
    ) => {
      // -- SEND transport --
      socket.emit(
        "createWebRtcTransport",
        { roomId, peerId: peerId.current, direction: "send" },
        async (error: string | null, transportData: {
          transportId: string
          iceParameters: object
          iceCandidates: object[]
          dtlsParameters: object
          iceServers: object[]
        } | undefined) => {
          if (error || !transportData) {
            dispatch({ type: "ERROR", error: `createWebRtcTransport send: ${error}` })
            return
          }

          const sendTransport = device.createSendTransport({
            id: transportData.transportId,
            iceParameters: transportData.iceParameters as RTCIceParameters,
            iceCandidates: transportData.iceCandidates as RTCIceCandidate[],
            dtlsParameters: transportData.dtlsParameters as RTCDtlsParameters,
            iceServers: transportData.iceServers as RTCIceServer[],
          })

          sendTransportRef.current = sendTransport

          sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
            socket.emit(
              "connectTransport",
              { roomId, peerId: peerId.current, transportId: sendTransport.id, dtlsParameters },
              (err: string | null) => {
                if (err) errback(new Error(err))
                else callback()
              },
            )
          })

          sendTransport.on("produce", ({ kind, rtpParameters, appData }, callback, errback) => {
            socket.emit(
              "produce",
              { roomId, peerId: peerId.current, transportId: sendTransport.id, kind, rtpParameters, appData },
              (err: string | null, data: { producerId: string } | undefined) => {
                if (err || !data) errback(new Error(err ?? "produce failed"))
                else callback({ id: data.producerId })
              },
            )
          })

          // Produce video
          const videoTrack = localStream.getVideoTracks()[0]
          if (videoTrack) {
            const videoProducer = await sendTransport.produce({ track: videoTrack })
            videoProducerRef.current = videoProducer
          }

          // Produce audio
          const audioTrack = localStream.getAudioTracks()[0]
          if (audioTrack) {
            const audioProducer = await sendTransport.produce({ track: audioTrack })
            audioProducerRef.current = audioProducer
          }
        },
      )

      // -- RECV transport --
      socket.emit(
        "createWebRtcTransport",
        { roomId, peerId: peerId.current, direction: "recv" },
        async (error: string | null, transportData: {
          transportId: string
          iceParameters: object
          iceCandidates: object[]
          dtlsParameters: object
          iceServers: object[]
        } | undefined) => {
          if (error || !transportData) {
            dispatch({ type: "ERROR", error: `createWebRtcTransport recv: ${error}` })
            return
          }

          const recvTransport = device.createRecvTransport({
            id: transportData.transportId,
            iceParameters: transportData.iceParameters as RTCIceParameters,
            iceCandidates: transportData.iceCandidates as RTCIceCandidate[],
            dtlsParameters: transportData.dtlsParameters as RTCDtlsParameters,
            iceServers: transportData.iceServers as RTCIceServer[],
          })

          recvTransportRef.current = recvTransport

          recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
            socket.emit(
              "connectTransport",
              { roomId, peerId: peerId.current, transportId: recvTransport.id, dtlsParameters },
              (err: string | null) => {
                if (err) errback(new Error(err))
                else callback()
              },
            )
          })

          // Consume existing peers
          for (const peer of existingPeers) {
            for (const { producerId, kind } of peer.producers) {
              await consumeProducer(peer.peerId, peer.displayName, producerId, kind as "audio" | "video")
            }
          }
        },
      )
    },
    [roomId, consumeProducer],
  )

  // -------------------------------------------------------------------------
  // Join
  // -------------------------------------------------------------------------
  const join = useCallback(async () => {
    if (state.status === "connecting" || state.status === "connected") return

    dispatch({ type: "CONNECTING" })

    let localStream: MediaStream
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = localStream
    } catch {
      dispatch({ type: "ERROR", error: "Нет доступа к камере или микрофону" })
      return
    }

    const socket = io(SERVER_URL, { transports: ["websocket"] })
    socketRef.current = socket

    socket.on("connect_error", (e) => {
      dispatch({ type: "ERROR", error: `Не удалось подключиться к серверу: ${e.message}` })
    })

    socket.on("connect", async () => {
      const device = new Device()
      deviceRef.current = device

      // First call joinRoom to get router RTP capabilities, then load device
      socket.emit(
        "joinRoom",
        {
          roomId,
          peerId: peerId.current,
          displayName,
          rtpCapabilities: {},
          create,
        },
        async (error: string | null, data: {
          rtpCapabilities: object
          existingPeers: Array<{
            peerId: string
            displayName: string
            producers: { producerId: string; kind: string }[]
          }>
        } | undefined) => {
          if (error || !data) {
            dispatch({ type: "ERROR", error: error ?? "joinRoom failed" })
            return
          }

          // Load device with router capabilities BEFORE creating transports
          await device.load({ routerRtpCapabilities: data.rtpCapabilities as RTCRtpCapabilities })

          dispatch({ type: "CONNECTED", localStream })
          // setupTransports uses device.rtpCapabilities which are now populated
          await setupTransports(socket, device, localStream, data.existingPeers)
        },
      )
    })

    // New remote producer appeared
    socket.on("newProducer", async ({ peerId: remotePeerId, displayName: remoteName, producerId, kind }) => {
      // Wait briefly for recv transport to be ready
      let attempts = 0
      const waitAndConsume = async () => {
        if (!recvTransportRef.current) {
          if (attempts++ < 20) {
            setTimeout(waitAndConsume, 250)
          }
          return
        }
        await consumeProducer(remotePeerId, remoteName, producerId, kind as "audio" | "video")
      }
      await waitAndConsume()
    })

    socket.on("peerLeft", ({ peerId: leftPeerId }) => {
      dispatch({ type: "PEER_LEFT", peerId: leftPeerId })
    })
  }, [roomId, displayName, state.status, setupTransports, consumeProducer])

  // -------------------------------------------------------------------------
  // Leave
  // -------------------------------------------------------------------------
  const leave = useCallback(() => {
    const socket = socketRef.current
    if (socket) {
      socket.emit("leaveRoom", { roomId, peerId: peerId.current })
      socket.disconnect()
      socketRef.current = null
    }
    sendTransportRef.current?.close()
    recvTransportRef.current?.close()
    sendTransportRef.current = null
    recvTransportRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    consumersRef.current.clear()
    dispatch({ type: "DISCONNECTED" })
  }, [roomId])

  // -------------------------------------------------------------------------
  // Toggle mic
  // -------------------------------------------------------------------------
  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const track = stream.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    dispatch({ type: "TOGGLE_MIC", isMuted: !track.enabled })
  }, [])

  // -------------------------------------------------------------------------
  // Toggle cam
  // -------------------------------------------------------------------------
  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    dispatch({ type: "TOGGLE_CAM", isOff: !track.enabled })
  }, [])

  // -------------------------------------------------------------------------
  // Auto-join on mount, leave on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    join()
    return () => {
      leave()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    status: state.status,
    error: state.error,
    peers: state.peers,
    localStream: state.localStream,
    isMicMuted: state.isMicMuted,
    isCamOff: state.isCamOff,
    toggleMic,
    toggleCam,
    leave,
  }
}
