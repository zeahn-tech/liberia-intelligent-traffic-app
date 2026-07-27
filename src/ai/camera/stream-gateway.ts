// ============================================================
// TrafficWatch AI — Stream Gateway Architecture
//
// Abstract adapter for future live camera stream integrations.
//
// This is the ARCHITECTURE, not a live implementation.
// When a real RTSP/HLS/WebRTC stream becomes available,
// a new StreamGateway implementation is registered here.
//
// Built-in placeholder gateways:
// - RTSP Gateway    (when RTSP → HLS transcoder is available)
// - HLS Gateway     (standard HLS playlist consumption)
// - WebRTC Gateway  (WebRTC peer connection)
// - File Gateway    (uploaded video files for testing)
// ============================================================

import type {
  CameraSourceType,
  StreamConfig,
  StreamConnection,
  StreamGateway,
  StreamStatus,
  RTSPConfig,
  HLSConfig,
  WebRTCConfig,
  MJPEGConfig,
  CameraDetectionEvent,
} from "./types";

// ─── Gateway Registry ───────────────────────────────────

/**
 * Registry of all available stream gateways.
 * Gateways self-register on module load.
 */
class GatewayRegistry {
  private gateways = new Map<CameraSourceType, StreamGateway>();

  /** Register a new gateway implementation */
  register(gateway: StreamGateway): void {
    this.gateways.set(gateway.type, gateway);
    console.debug(`[StreamGateway] Registered: ${gateway.type}`);
  }

  /** Get a gateway by source type */
  get(type: CameraSourceType): StreamGateway | undefined {
    return this.gateways.get(type);
  }

  /** Check if a gateway exists for the given type */
  has(type: CameraSourceType): boolean {
    return this.gateways.has(type);
  }

  /** List all registered gateway types */
  listTypes(): CameraSourceType[] {
    return Array.from(this.gateways.keys());
  }

  /** List all registered gateways */
  listAll(): StreamGateway[] {
    return Array.from(this.gateways.values());
  }
}

/** Singleton gateway registry */
export const gatewayRegistry = new GatewayRegistry();

// ─── HLS Gateway (HTTP Live Streaming) ──────────────────

/**
 * Gateway for HLS video streams.
 * HLS is the most widely supported adaptive streaming protocol
 * and works well in modern browsers via <video> tags.
 *
 * To integrate a real HLS stream:
 * 1. Create an HLSConfig with the playlist URL
 * 2. Call gatewayRegistry.register(new HLSGateway())
 * 3. Use streamManager.connect(config) to start streaming
 */
export class HLSGateway implements StreamGateway {
  readonly type: CameraSourceType = "hls";
  private connections = new Map<string, { status: StreamStatus; config: StreamConfig }>();

  async connect(config: StreamConfig): Promise<StreamConnection> {
    const id = `hls-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.connections.set(id, { status: "connecting", config });

    // ─── Future Implementation ─────────────────────────
    // When an HLS stream source is available:
    //
    // 1. Validate the HLS playlist URL:
    //    const response = await fetch(config.url);
    //    if (!response.ok) throw new Error(`HLS stream unreachable: ${response.status}`);
    //
    // 2. For browsers, use hls.js library to load the stream:
    //    import Hls from 'hls.js';
    //    const video = document.createElement('video');
    //    if (Hls.isSupported()) {
    //      const hls = new Hls();
    //      hls.loadSource(config.url);
    //      hls.attachMedia(video);
    //    }
    //
    // 3. For server-side processing, use FFmpeg:
    //    ffmpeg -i <hls_url> -f image2pipe -vcodec ppm -
    //
    // 4. For low-latency HLS (LL-HLS):
    //    Use partial segments and preload hints
    //
    // 5. For recording, pipe to a file or S3:
    //    ffmpeg -i <hls_url> -c copy output.mp4

    console.debug(`[HLSGateway] Connect called for ${config.url} (connection: ${id})`);

    this.connections.set(id, { status: "connected", config });

    return {
      id,
      gatewayType: "hls",
      status: "connected",
      // In production, return the video element's srcObject or a blob URL
      mediaSource: config.url,
      close: () => {
        this.connections.delete(id);
        console.debug(`[HLSGateway] Connection closed: ${id}`);
      },
    };
  }

  async disconnect(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
  }

  getStatus(connectionId: string): StreamStatus {
    return this.connections.get(connectionId)?.status || "disconnected";
  }

  async listAvailableStreams(): Promise<StreamConfig[]> {
    // ─── Future Implementation ─────────────────────────
    // Query a central stream management server or
    // scan a local network for HLS sources.
    console.debug("[HLSGateway] listAvailableStreams called — no sources configured");
    return [];
  }
}

// ─── RTSP Gateway ───────────────────────────────────────

/**
 * Gateway for RTSP camera streams.
 *
 * RTSP streams typically require a transcoding step
 * (RTSP → HLS/WebRTC) since browsers don't natively
 * support RTSP.
 *
 * Integration guide:
 * 1. Deploy a media server (like MediaMTX, Janus, or LiveKit)
 * 2. Configure it to accept RTSP pulls
 * 3. The transcoded HLS/WebRTC output is then consumed
 *    by the HLSGateway or WebRTCGateway
 */
export class RTSPGateway implements StreamGateway {
  readonly type: CameraSourceType = "rtsp";
  private connections = new Map<string, { status: StreamStatus; config: StreamConfig }>();

  async connect(config: StreamConfig): Promise<StreamConnection> {
    const id = `rtsp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.connections.set(id, { status: "connecting", config });

    // ─── Future Implementation ─────────────────────────
    // RTSP → Browser requires transcoding:
    //
    // Option A: Media Server (recommended for production)
    //   Deploy MediaMTX or Janus as a media proxy:
    //   mediamtx.yml:
    //     paths:
    //       cam_001:
    //         source: rtsp://camera-ip:554/stream1
    //         sourceOnDemand: true
    //   Then consume the HLS output:
    //     const hlsConfig: HLSConfig = {
    //       playlistUrl: `https://mediaserver/hls/cam_001/index.m3u8`,
    //     };
    //     const hlsGateway = new HLSGateway();
    //     hlsGateway.connect({ url: hlsConfig.playlistUrl, sourceType: "hls" });
    //
    // Option B: FFmpeg Transcoding (for single streams)
    //   ffmpeg -rtsp_transport tcp -i rtsp://...
    //     -f hls -hls_time 2 -hls_list_size 3 output.m3u8
    //
    // Option C: WebRTC via Janus
    //   Janus streaming plugin with RTSP source

    console.debug(`[RTSPGateway] Connect called for ${config.url} (connection: ${id})`);

    this.connections.set(id, { status: "connected", config });

    return {
      id,
      gatewayType: "rtsp",
      status: "connected",
      mediaSource: config.url,
      close: () => {
        this.connections.delete(id);
      },
    };
  }

  async disconnect(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
  }

  getStatus(connectionId: string): StreamStatus {
    return this.connections.get(connectionId)?.status || "disconnected";
  }

  async listAvailableStreams(): Promise<StreamConfig[]> {
    // ─── Future Implementation ─────────────────────────
    // Use ONVIF discovery protocol to find cameras on local network
    // or query a device management database.
    return [];
  }
}

// ─── WebRTC Gateway ─────────────────────────────────────

/**
 * Gateway for WebRTC peer-to-peer video streams.
 * Used for low-latency drone feeds, body cameras, and mobile streams.
 */
export class WebRTCGateway implements StreamGateway {
  readonly type: CameraSourceType = "webrtc";
  private connections = new Map<string, { status: StreamStatus; config: StreamConfig }>();

  async connect(config: StreamConfig): Promise<StreamConnection> {
    const id = `webrtc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.connections.set(id, { status: "connecting", config });

    // ─── Future Implementation ─────────────────────────
    // 1. Create RTCPeerConnection with ICE servers from config
    // 2. Create an SDP offer
    // 3. Send offer to signaling server
    // 4. Receive SDP answer
    // 5. Set remote description
    // 6. On ICE candidate, send to signaling peer
    //
    // const pc = new RTCPeerConnection({ iceServers: config.protocolConfig?.iceServers });
    // pc.ontrack = (event) => resolve(event.streams[0]);
    // const offer = await pc.createOffer();
    // await pc.setLocalDescription(offer);
    // // Send offer to signaling server...
    //
    // For drone feeds, also implement:
    // - Telemetry data overlay (GPS, altitude, speed)
    // - Auto-reconnect on signal loss
    // - Bandwidth adaptation

    console.debug(`[WebRTCGateway] Connect called for ${config.url} (connection: ${id})`);

    this.connections.set(id, { status: "connected", config });

    return {
      id,
      gatewayType: "webrtc",
      status: "connected",
      close: () => {
        this.connections.delete(id);
      },
    };
  }

  async disconnect(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
  }

  getStatus(connectionId: string): StreamStatus {
    return this.connections.get(connectionId)?.status || "disconnected";
  }

  async listAvailableStreams(): Promise<StreamConfig[]> {
    // ─── Future Implementation ─────────────────────────
    // Query the signaling server for available peer streams.
    return [];
  }
}

// ─── File Gateway (for uploaded video files) ────────────

/**
 * Gateway for uploaded video files.
 * Useful for testing the analysis pipeline with recorded footage
 * from body cameras or dashcams.
 */
export class FileGateway implements StreamGateway {
  readonly type: CameraSourceType = "file";
  private connections = new Map<string, { status: StreamStatus; config: StreamConfig }>();

  async connect(config: StreamConfig): Promise<StreamConnection> {
    const id = `file-${Date.now()}`;
    this.connections.set(id, { status: "connected", config });

    return {
      id,
      gatewayType: "file",
      status: "connected",
      mediaSource: config.url,
      close: () => {
        this.connections.delete(id);
      },
    };
  }

  async disconnect(connectionId: string): Promise<void> {
    this.connections.delete(connectionId);
  }

  getStatus(connectionId: string): StreamStatus {
    return this.connections.get(connectionId)?.status || "disconnected";
  }

  async listAvailableStreams(): Promise<StreamConfig[]> {
    return [];
  }
}

// ─── Auto-register built-in gateways ────────────────────

gatewayRegistry.register(new HLSGateway());
gatewayRegistry.register(new RTSPGateway());
gatewayRegistry.register(new WebRTCGateway());
gatewayRegistry.register(new FileGateway());

// ─── Stream Connection Manager ─────────────────────────

/**
 * Manages all active stream connections.
 * This is the primary entry point for connecting to camera streams.
 *
 * Usage:
 * ```ts
 * // When a real camera is added:
 * const camera: CameraRegistration = {
 *   id: "cam-001",
 *   // ...
 *   stream: { url: "https://...", sourceType: "hls" }
 * };
 * const connection = await streamManager.connect(camera);
 * ```
 */
export const streamManager = {
  /** Connect to a camera's stream */
  async connect(camera: {
    id: string;
    stream: { url: string; sourceType: CameraSourceType };
  }): Promise<StreamConnection> {
    const gateway = gatewayRegistry.get(camera.stream.sourceType);
    if (!gateway) {
      throw new Error(`No gateway registered for stream type: ${camera.stream.sourceType}`);
    }

    const config: StreamConfig = {
      url: camera.stream.url,
      sourceType: camera.stream.sourceType,
    };

    return gateway.connect(config);
  },

  /** Disconnect from a camera stream */
  async disconnect(connectionId: string): Promise<void> {
    for (const gateway of gatewayRegistry.listAll()) {
      const status = gateway.getStatus(connectionId);
      if (status !== "disconnected" && status !== "offline") {
        await gateway.disconnect(connectionId);
        return;
      }
    }
  },

  /** Get all available gateway types */
  availableGateways(): CameraSourceType[] {
    return gatewayRegistry.listTypes();
  },

  /** Check if a stream type is supported */
  isTypeSupported(type: CameraSourceType): boolean {
    return gatewayRegistry.has(type);
  },
};
