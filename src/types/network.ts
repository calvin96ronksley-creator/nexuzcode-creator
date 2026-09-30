export type ProtocolType = 'HTTPS' | 'QUIC' | 'DNS' | 'WSS' | 'gRPC' | 'TCP';
export type NodeType = 'cdn' | 'cloud' | 'dns' | 'gateway' | 'api' | 'p2p';
export type ConnectionStatus = 'active' | 'warning' | 'standby';

export interface TracerouteHop {
  hopNumber: number;
  ip: string;
  hostname: string;
  latencyMs: number;
  carrier: string;
  location: string;
  status: 'ok' | 'degraded' | 'timeout';
}

export interface WhoisRecord {
  asn: string;
  asnOrg: string;
  netName: string;
  cidr: string;
  registrar: string;
  registeredDate: string;
  updatedDate: string;
  abuseContact: string;
  reputationScore: number; // e.g. 98%
  dnsServers: string[];
  orgAddress: string;
  statusComment: string;
}

export interface NetworkConnection {
  id: string;
  name: string;
  host: string;
  ip: string;
  port: number;
  protocol: ProtocolType;
  type: NodeType;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  status: ConnectionStatus;
  latencyMs: number;
  jitterMs: number;
  rxKbps: number;
  txKbps: number;
  packetLossRate: number;
  totalPackets: number;
  encryption: {
    protocol: string;
    cipher: string;
    certIssuer: string;
    certValidDays: number;
  };
  whois: WhoisRecord;
  tracerouteHops: TracerouteHop[];
}

export interface LivePacket {
  id: string;
  timestamp: string;
  connectionId: string;
  targetHost: string;
  protocol: ProtocolType;
  direction: 'IN' | 'OUT';
  bytes: number;
  flags: string[];
  snippet: string;
}

export interface LocalOrigin {
  name: string;
  ip: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  isp: string;
}
