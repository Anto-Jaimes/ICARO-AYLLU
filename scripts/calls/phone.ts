/**
 * Telephone pieces shared by the free-call program and its test: the connection to the Yautalk
 * exchange as one extension, and audio handled on this computer (PCMU, the codec of phone
 * networks), so two calls can be joined, announced and recorded here.
 * Proven against the real exchange on 2026-11-07: calls out, audio both ways, keys pressed,
 * two calls at once on one extension, and joining them.
 */
import { readFileSync } from 'node:fs';
import { MediaStreamTrack, RTCPeerConnection, RTCRtpCodecParameters, RtpHeader, RtpPacket } from 'werift';
import { Inviter, SessionState, UserAgent, type Invitation, type Session, type SessionDescriptionHandler } from 'sip.js';

export const log = (...parts: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...parts);
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Only the last digits, so the console never shows whole phone numbers. */
export const maskPhone = (phone: string) => `***${phone.slice(-3)}`;

export interface ExchangeConfig {
  server: string;
  extension: string;
  password: string;
}

/** Reads the exchange account from the environment (.env.relay). Never prints it. */
export function loadExchangeConfig(): ExchangeConfig {
  const extension = process.env.YAUTALK_EXTENSION;
  const password = process.env.YAUTALK_PASSWORD;
  if (!extension || !password) throw new Error('Falta YAUTALK_EXTENSION o YAUTALK_PASSWORD en .env.relay');
  return { server: process.env.YAUTALK_SERVER ?? 'pbx.yautalk.com', extension, password };
}

// ---- G.711 mu-law ---------------------------------------------------------------------------

export function linearToUlaw(value: number): number {
  let sample = value;
  const sign = sample < 0 ? 0x80 : 0;
  if (sign) sample = -sample;
  sample = Math.min(sample, 32635) + 0x84;
  let exponent = 7;
  for (let mask = 0x4000; (sample & mask) === 0 && exponent > 0; mask >>= 1) exponent--;
  const mantissa = (sample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

export function ulawToLinear(value: number): number {
  const u = ~value & 0xff;
  const exponent = (u >> 4) & 0x07;
  const sample = (((u & 0x0f) << 3) + 0x84) << exponent;
  return u & 0x80 ? 0x84 - sample : sample - 0x84;
}

// ---- WAV --------------------------------------------------------------------------------------

export function readWavSamples(source: string | Buffer): Int16Array {
  const file = typeof source === 'string' ? readFileSync(source) : source;
  let offset = 12;
  while (offset < file.length) {
    const id = file.toString('ascii', offset, offset + 4);
    const size = file.readUInt32LE(offset + 4);
    if (id === 'data') {
      const data = Buffer.from(file.subarray(offset + 8, offset + 8 + size));
      return new Int16Array(data.buffer, data.byteOffset, data.length / 2);
    }
    offset += 8 + size;
  }
  throw new Error('WAV sin datos');
}

/** 8 kHz, 16-bit WAV. Two channels keep each side of a call apart for whoever reviews it. */
export function wavBuffer(channels: number[][]): Buffer {
  const length = Math.max(...channels.map((channel) => channel.length));
  const samples = new Int16Array(length * channels.length);
  for (let i = 0; i < length; i++) {
    channels.forEach((channel, c) => {
      samples[i * channels.length + c] = channel[i] ?? 0;
    });
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples.length * 2, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels.length, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(8000 * 2 * channels.length, 28);
  header.writeUInt16LE(2 * channels.length, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples.length * 2, 40);
  return Buffer.concat([header, Buffer.from(samples.buffer)]);
}

export const beep = (ms = 300): Int16Array =>
  Int16Array.from({ length: (8000 * ms) / 1000 }, (_, i) => Math.round(Math.sin((2 * Math.PI * 1000 * i) / 8000) * 9000));

// ---- Audio of one call --------------------------------------------------------------------------

const DTMF_KEYS = '0123456789*#ABCD';

// FreeSWITCH answers without "a=mid", the older valid form; werift needs it to pair each answer
// section with its offer section. Checked against a real answer from the exchange.
export function completeAnswer(answer: string, offer: string): string {
  const mids = [...offer.matchAll(/^a=mid:(\S+)/gm)].map((match) => match[1]);
  const [session, ...media] = answer.split(/\r\n(?=m=)/);
  const sections = media.map((part, index) => {
    let section = part.replace(/\r\n$/, '');
    if (!/^a=mid:/m.test(section)) section += `\r\na=mid:${mids[index] ?? index}`;
    if (!/^a=(sendrecv|sendonly|recvonly|inactive)$/m.test(section)) section += '\r\na=sendrecv';
    return section;
  });
  return `${[session, ...sections].join('\r\n')}\r\n`;
}

export class PhoneAudio implements SessionDescriptionHandler {
  readonly pc: RTCPeerConnection;
  readonly track = new MediaStreamTrack({ kind: 'audio' });
  readonly heard: number[] = [];
  readonly digits: string[] = [];
  /** Called with every frame of voice received, to pass it on to another call. */
  onFrame?: (payload: Buffer) => void;
  packetsIn = 0;
  private lastDtmfTimestamp = -1;
  private sequence = Math.floor(Math.random() * 65535);
  private timestamp = Math.floor(Math.random() * 1e9);
  private readonly ssrc = Math.floor(Math.random() * 2 ** 32);

  constructor() {
    this.pc = new RTCPeerConnection({
      codecs: {
        audio: [
          new RTCRtpCodecParameters({ mimeType: 'audio/PCMU', clockRate: 8000, channels: 1, payloadType: 0 }),
          new RTCRtpCodecParameters({ mimeType: 'audio/telephone-event', clockRate: 8000, payloadType: 101, parameters: '0-16' })
        ]
      },
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    const transceiver = this.pc.addTransceiver(this.track, { direction: 'sendrecv' });
    transceiver.onTrack.subscribe((remote) => {
      remote.onReceiveRtp.subscribe((rtp) => {
        this.packetsIn++;
        if (rtp.header.payloadType === 101) {
          this.readDtmf(rtp);
          return;
        }
        for (const byte of rtp.payload) this.heard.push(ulawToLinear(byte));
        this.onFrame?.(rtp.payload);
      });
    });
  }

  // RFC 4733: one key press repeats in several packets; count it once per timestamp.
  private readDtmf(rtp: RtpPacket): void {
    if (rtp.header.timestamp === this.lastDtmfTimestamp) return;
    this.lastDtmfTimestamp = rtp.header.timestamp;
    this.digits.push(DTMF_KEYS[rtp.payload[0]] ?? '?');
  }

  /** Sends one frame of mu-law voice as the next packet of this call. */
  sendFrame(payload: Buffer, marker = false): void {
    this.track.writeRtp(new RtpPacket(
      new RtpHeader({ payloadType: 0, sequenceNumber: this.sequence, timestamp: this.timestamp, ssrc: this.ssrc, marker }),
      payload
    ));
    this.sequence = (this.sequence + 1) & 0xffff;
    this.timestamp = (this.timestamp + payload.length) >>> 0;
  }

  /** Sends samples in 20 ms packets at real time. */
  async play(samples: Int16Array): Promise<void> {
    for (let start = 0; start < samples.length; start += 160) {
      const frame = Buffer.alloc(160, 0xff);
      for (let i = 0; i < 160 && start + i < samples.length; i++) frame[i] = linearToUlaw(samples[start + i]);
      this.sendFrame(frame, start === 0);
      await wait(20);
    }
  }

  /** Keeps sending silence so the exchange does not drop a line that is waiting. Returns a stop function. */
  holdWithSilence(): () => void {
    const silence = Buffer.alloc(160, 0xff);
    const timer = setInterval(() => this.sendFrame(silence), 20);
    return () => clearInterval(timer);
  }

  async getDescription() {
    const description = this.pc.signalingState === 'have-remote-offer' ? await this.pc.createAnswer() : await this.pc.createOffer();
    await this.pc.setLocalDescription(description);
    return { body: this.pc.localDescription!.sdp, contentType: 'application/sdp' };
  }

  hasDescription(contentType: string): boolean {
    return contentType === 'application/sdp';
  }

  async setDescription(sdp: string): Promise<void> {
    const type = this.pc.signalingState === 'have-local-offer' ? 'answer' : 'offer';
    const remote = type === 'answer' ? completeAnswer(sdp, this.pc.localDescription!.sdp) : sdp;
    await this.pc.setRemoteDescription({ type, sdp: remote });
  }

  sendDtmf(): boolean {
    return false;
  }

  close(): void {
    this.pc.close().catch(() => {});
  }
}

// ---- Calls ---------------------------------------------------------------------------------------

export function startAgent(config: ExchangeConfig, onInvite?: (invitation: Invitation) => void): UserAgent {
  return new UserAgent({
    uri: UserAgent.makeURI(`sip:${config.extension}@${config.server}`),
    transportOptions: { server: `wss://${config.server}:7443` },
    authorizationUsername: config.extension,
    authorizationPassword: config.password,
    displayName: 'AYLLU',
    logLevel: 'error',
    sessionDescriptionHandlerFactory: (_session: Session) => new PhoneAudio(),
    delegate: { onInvite }
  });
}

export async function stopAgent(agent: UserAgent): Promise<void> {
  await Promise.race([agent.stop().catch(() => {}), wait(3_000)]);
}

export interface Leg {
  inviter: Inviter;
  audio: PhoneAudio;
  ended: Promise<void>;
  isEnded: () => boolean;
}

/** Places one call and resolves when it is answered, or null if it is not within the ring time. */
export async function dial(agent: UserAgent, config: ExchangeConfig, number: string, label: string, ringMs = 45_000): Promise<Leg | null> {
  const target = UserAgent.makeURI(`sip:${number}@${config.server}`);
  if (!target) return null;
  const inviter = new Inviter(agent, target, { earlyMedia: false });
  const ended = new Promise<void>((resolve) => {
    inviter.stateChange.addListener((state) => state === SessionState.Terminated && resolve());
  });
  const answered = new Promise<boolean>((resolve) => {
    inviter.stateChange.addListener((state) => {
      if (state === SessionState.Established) resolve(true);
      if (state === SessionState.Terminated) resolve(false);
    });
  });

  log(`${label}: llamando a ${maskPhone(number)}`);
  await inviter.invite({
    requestDelegate: {
      onReject: (response) => log(`${label}: no se conectó (${response.message.statusCode})`)
    }
  });

  if (!(await Promise.race([answered, wait(ringMs).then(() => false)]))) {
    await inviter.cancel().catch(() => {});
    log(`${label}: no contestó`);
    return null;
  }
  log(`${label}: contestó`);
  return {
    inviter,
    audio: inviter.sessionDescriptionHandler as unknown as PhoneAudio,
    ended,
    isEnded: () => inviter.state === SessionState.Terminated
  };
}

export async function hangUp(leg: Leg | null): Promise<void> {
  if (leg && !leg.isEnded()) await leg.inviter.bye().catch(() => {});
}
