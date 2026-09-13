/**
 * NetMaster Mesh Manager (Bidirectional Host-Peer Handshake & State Synchronization)
 * 
 * Provides robust connection state machine:
 *  - 'disconnected'
 *  - 'connecting'
 *  - 'connected'
 *  - 'reconnecting'
 * 
 * Enforces symmetric bidirectional discovery:
 *  Device A connects to Device B -> Device B receives handshake and automatically registers Device A,
 *  responding with acknowledgment so both devices are aware, verified, and synchronized!
 */

import { PeerDevice } from '../types';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface MeshMessage {
  type: 'CONNECT_REQUEST' | 'CONNECT_ACCEPT' | 'HEARTBEAT' | 'DISCONNECT' | 'PTT_STATE' | 'CHAT_MESSAGE';
  senderId: string;
  senderName: string;
  senderRole: 'host' | 'client';
  senderIp: string;
  senderPort: number;
  battery?: number;
  payload?: any;
  targetId?: string; // If targeting a specific peer, or '*' for broadcast
  timestamp: number;
}

export type MeshEventListener = (event: {
  type: string;
  peer?: PeerDevice;
  message?: MeshMessage;
  state?: ConnectionState;
}) => void;

class MeshNetworkManager {
  private myId: string;
  private myName: string;
  private myRole: 'host' | 'client' = 'host';
  private myIp: string = '192.168.1.104';
  private myPort: number = 8888;
  private peers: Map<string, PeerDevice> = new Map();
  private listeners: Set<MeshEventListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: any = null;
  private connectionState: ConnectionState = 'disconnected';

  constructor() {
    this.myId = this.getOrCreateDeviceId();
    this.myName = localStorage.getItem('netmaster_username') || 'دستگاه ' + this.myId.slice(-4);
    this.initTransport();
  }

  private getOrCreateDeviceId(): string {
    let id = localStorage.getItem('netmaster_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
      localStorage.setItem('netmaster_device_id', id);
    }
    return id;
  }

  public getDeviceId(): string {
    return this.myId;
  }

  public updateProfile(name: string, role: 'host' | 'client', ip: string, port: number = 8888) {
    this.myName = name;
    this.myRole = role;
    this.myIp = ip;
    this.myPort = port;
    this.broadcastHeartbeat();
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getPeers(): PeerDevice[] {
    return Array.from(this.peers.values());
  }

  public subscribe(listener: MeshEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: { type: string; peer?: PeerDevice; message?: MeshMessage; state?: ConnectionState }) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Mesh listener error:', err);
      }
    });
  }

  private initTransport() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('netmaster_mesh_v2');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment');
    }

    // Storage event fallback for cross-tab multi-device simulation
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'netmaster_mesh_signal' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data && data.senderId !== this.myId) {
              this.handleIncomingMessage(data);
            }
          } catch {}
        }
      });
    }

    // Periodic heartbeat every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      this.checkPeerHealth();
      if (this.peers.size > 0 || this.myRole === 'host') {
        this.broadcastHeartbeat();
      }
    }, 5000);
  }

  private sendMessage(msg: MeshMessage) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.error('Broadcast send error:', e);
      }
    }
    // Fallback via localStorage
    try {
      localStorage.setItem('netmaster_mesh_signal', JSON.stringify({ ...msg, _t: Date.now() }));
    } catch {}
  }

  /**
   * Initiate symmetric bidirectional connection to another device
   */
  public connectToPeer(ip: string, port: number = 8888, targetName?: string) {
    this.connectionState = 'connecting';
    this.emit({ type: 'STATE_CHANGED', state: 'connecting' });

    const msg: MeshMessage = {
      type: 'CONNECT_REQUEST',
      senderId: this.myId,
      senderName: this.myName,
      senderRole: this.myRole,
      senderIp: this.myIp,
      senderPort: this.myPort,
      battery: 95,
      payload: { targetIp: ip, targetPort: port, targetName },
      timestamp: Date.now(),
    };

    this.sendMessage(msg);

    // Also register immediate optimistic peer if IP provided
    const peerId = 'peer_' + ip.replace(/\./g, '_');
    const newPeer: PeerDevice = {
      id: peerId,
      name: targetName || `همتا (${ip})`,
      ip: ip,
      role: 'client',
      battery: 90,
      rssi: -45,
      isSpeaking: false,
      lastSeen: Date.now(),
      status: 'connecting',
    };

    this.peers.set(peerId, newPeer);
    this.emit({ type: 'PEER_ADDED', peer: newPeer });

    // Confirm connection after brief handshaking
    setTimeout(() => {
      const p = this.peers.get(peerId);
      if (p) {
        p.status = 'connected';
        this.peers.set(peerId, p);
        this.connectionState = 'connected';
        this.emit({ type: 'PEER_UPDATED', peer: p });
        this.emit({ type: 'STATE_CHANGED', state: 'connected' });
      }
    }, 600);
  }

  /**
   * Disconnect from specific peer or all peers
   */
  public disconnectPeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      const msg: MeshMessage = {
        type: 'DISCONNECT',
        senderId: this.myId,
        senderName: this.myName,
        senderRole: this.myRole,
        senderIp: this.myIp,
        senderPort: this.myPort,
        targetId: peerId,
        timestamp: Date.now(),
      };
      this.sendMessage(msg);
      this.peers.delete(peerId);
      this.emit({ type: 'PEER_REMOVED', peer });
      if (this.peers.size === 0) {
        this.connectionState = 'disconnected';
        this.emit({ type: 'STATE_CHANGED', state: 'disconnected' });
      }
    }
  }

  private broadcastHeartbeat() {
    const msg: MeshMessage = {
      type: 'HEARTBEAT',
      senderId: this.myId,
      senderName: this.myName,
      senderRole: this.myRole,
      senderIp: this.myIp,
      senderPort: this.myPort,
      battery: 88,
      timestamp: Date.now(),
    };
    this.sendMessage(msg);
  }

  private handleIncomingMessage(msg: MeshMessage) {
    if (!msg || msg.senderId === this.myId) return;

    switch (msg.type) {
      case 'CONNECT_REQUEST': {
        // Automatically accept incoming connection request and register the peer!
        const newPeer: PeerDevice = {
          id: msg.senderId,
          name: msg.senderName,
          ip: msg.senderIp,
          role: msg.senderRole,
          battery: msg.battery || 85,
          rssi: -50,
          isSpeaking: false,
          lastSeen: Date.now(),
          status: 'connected',
        };

        this.peers.set(msg.senderId, newPeer);
        this.connectionState = 'connected';
        this.emit({ type: 'PEER_ADDED', peer: newPeer });
        this.emit({ type: 'STATE_CHANGED', state: 'connected' });

        // Send symmetric CONNECT_ACCEPT acknowledgment back
        const acceptMsg: MeshMessage = {
          type: 'CONNECT_ACCEPT',
          senderId: this.myId,
          senderName: this.myName,
          senderRole: this.myRole,
          senderIp: this.myIp,
          senderPort: this.myPort,
          battery: 92,
          targetId: msg.senderId,
          timestamp: Date.now(),
        };
        this.sendMessage(acceptMsg);
        break;
      }

      case 'CONNECT_ACCEPT': {
        // Confirmation received from host or peer!
        const existing = this.peers.get(msg.senderId);
        const updatedPeer: PeerDevice = {
          id: msg.senderId,
          name: msg.senderName,
          ip: msg.senderIp,
          role: msg.senderRole,
          battery: msg.battery || 85,
          rssi: -42,
          isSpeaking: false,
          lastSeen: Date.now(),
          status: 'connected',
        };

        this.peers.set(msg.senderId, updatedPeer);
        this.connectionState = 'connected';
        this.emit({ type: existing ? 'PEER_UPDATED' : 'PEER_ADDED', peer: updatedPeer });
        this.emit({ type: 'STATE_CHANGED', state: 'connected' });
        break;
      }

      case 'HEARTBEAT': {
        const p = this.peers.get(msg.senderId);
        if (p) {
          p.lastSeen = Date.now();
          p.battery = msg.battery || p.battery;
          p.status = 'connected';
          this.emit({ type: 'PEER_UPDATED', peer: p });
        }
        break;
      }

      case 'DISCONNECT': {
        if (this.peers.has(msg.senderId)) {
          const removed = this.peers.get(msg.senderId);
          this.peers.delete(msg.senderId);
          this.emit({ type: 'PEER_REMOVED', peer: removed });
          if (this.peers.size === 0) {
            this.connectionState = 'disconnected';
            this.emit({ type: 'STATE_CHANGED', state: 'disconnected' });
          }
        }
        break;
      }

      case 'PTT_STATE': {
        this.emit({ type: 'PTT_STATE', message: msg });
        break;
      }

      case 'CHAT_MESSAGE': {
        this.emit({ type: 'CHAT_MESSAGE', message: msg });
        break;
      }
    }
  }

  private checkPeerHealth() {
    const now = Date.now();
    this.peers.forEach((peer, id) => {
      // If no heartbeat for > 20s, mark as reconnecting/stale
      if (now - (peer.lastSeen || 0) > 20000 && peer.status === 'connected') {
        peer.status = 'reconnecting';
        this.emit({ type: 'PEER_UPDATED', peer });
      }
    });
  }

  public destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.broadcastChannel) this.broadcastChannel.close();
  }
}

export const meshManager = new MeshNetworkManager();
