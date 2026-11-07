import React, { useEffect, useRef, useState } from 'react';
import { SwitchCamera, X } from 'lucide-react';
import { useBackHandler } from '../hooks/useBackHandler';

export type CameraMode = 'photo' | 'video';
type Facing = 'environment' | 'user';

// Stops just under the minute: the check that follows rejects anything over 60 seconds.
const MAX_RECORDING_MS = 59_000;
// About 19 MB per minute. A phone's own camera app easily passes the 50 MB upload limit.
const VIDEO_BITS_PER_SECOND = 2_500_000;
const AUDIO_BITS_PER_SECOND = 96_000;
const PHOTO_QUALITY = 0.85;

// MP4 first because it plays on every phone. `type` has no codecs: the storage rejects them.
const RECORDING_FORMATS = [
  { mimeType: 'video/mp4;codecs=avc1.42E01F,mp4a.40.2', type: 'video/mp4', extension: 'mp4' },
  { mimeType: 'video/mp4', type: 'video/mp4', extension: 'mp4' },
  { mimeType: 'video/webm;codecs=vp9,opus', type: 'video/webm', extension: 'webm' },
  { mimeType: 'video/webm', type: 'video/webm', extension: 'webm' }
];

export const canUseCamera = (): boolean => Boolean(navigator.mediaDevices?.getUserMedia);
export const canRecordVideo = (): boolean => canUseCamera() && typeof MediaRecorder !== 'undefined';

async function openCamera(mode: CameraMode, facing: Facing): Promise<MediaStream> {
  const [width, height] = mode === 'photo' ? [1920, 1080] : [1280, 720];
  const video: MediaTrackConstraints = { facingMode: { ideal: facing }, width: { ideal: width }, height: { ideal: height } };

  if (mode === 'photo') return navigator.mediaDevices.getUserMedia({ video });
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: true });
  } catch {
    // A computer without a microphone can still record.
    return navigator.mediaDevices.getUserMedia({ video });
  }
}

function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

function explainProblem(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError') return 'Falta el permiso de la cámara. Actívalo en los ajustes o elige un archivo.';
  if (name === 'NotFoundError') return 'Este equipo no tiene cámara. Puedes elegir un archivo.';
  return 'No se pudo abrir la cámara. Puedes elegir un archivo.';
}

interface CameraCaptureProps {
  mode: CameraMode;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ mode, onCapture, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [canSwitch, setCanSwitch] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);

  useBackHandler(true, onClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Starting on the title reads it aloud and keeps the focus ring off the close button.
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setIsLive(false);

    openCamera(mode, facing)
      .then(async (stream) => {
        if (isCancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsLive(true);

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!isCancelled) setCanSwitch(devices.filter((device) => device.kind === 'videoinput').length > 1);
      })
      .catch((err) => {
        console.warn('No se pudo abrir la cámara:', err);
        if (!isCancelled) setProblem(explainProblem(err));
      });

    return () => {
      isCancelled = true;
      if (streamRef.current) stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [mode, facing]);

  // Closing the camera in the middle of a recording throws that video away.
  useEffect(() => () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder?.state === 'recording') recorder.stop();
  }, []);

  const stopRecording = () => {
    setIsRecording(false);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  useEffect(() => {
    if (!isRecording) return;

    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setSeconds(Math.floor(elapsed / 1000));
      if (elapsed >= MAX_RECORDING_MS) stopRecording();
    }, 250);
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = () => {
    const stream = streamRef.current;
    const format = RECORDING_FORMATS.find((option) => MediaRecorder.isTypeSupported(option.mimeType));
    if (!stream || !format) {
      setProblem('Este equipo no puede grabar video. Puedes elegir un archivo.');
      return;
    }

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: format.mimeType,
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND
    });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      if (recorderRef.current !== recorder) return;
      recorderRef.current = null;
      onCapture(new File(chunks, `video-${Date.now()}.${format.extension}`, { type: format.type }));
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setSeconds(0);
    setIsRecording(true);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', PHOTO_QUALITY);
  };

  const shoot = () => {
    if (mode === 'photo') takePhoto();
    else if (isRecording) stopRecording();
    else startRecording();
  };

  const title = mode === 'photo' ? 'Tomar foto' : 'Grabar video';
  const shutterLabel = mode === 'photo' ? 'Tomar foto' : isRecording ? 'Detener' : 'Empezar a grabar';

  return (
    <dialog
      ref={dialogRef}
      className="camera"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="shrink-0 flex items-center px-1 min-h-14" style={{ paddingTop: 'var(--safe-top)' }}>
        <button type="button" onClick={onClose} aria-label="Cerrar cámara" className="grid place-items-center w-12 h-12">
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <h2 ref={titleRef} tabIndex={-1} className="flex-1 text-center text-row font-bold outline-none">
          {isRecording ? <span role="timer">0:{String(seconds).padStart(2, '0')} de 1:00</span> : title}
        </h2>
        <span aria-hidden="true" className="w-12" />
      </div>

      {problem ? (
        <div className="flex-1 flex flex-col justify-center gap-4 p-6 text-center">
          <p role="alert" className="text-row">{problem}</p>
          <button type="button" onClick={onClose} className="btn btn-primary">Volver</button>
        </div>
      ) : (
        <>
          <video ref={videoRef} muted autoPlay playsInline className="flex-1 min-h-0 w-full object-contain" />
          <div
            className="shrink-0 grid grid-cols-3 items-center justify-items-center px-4 pt-3"
            style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}
          >
            <span aria-hidden="true" />
            <button
              type="button"
              onClick={shoot}
              disabled={!isLive}
              aria-label={shutterLabel}
              className="camera-shutter"
              data-mode={mode}
              data-recording={isRecording ? '' : undefined}
            />
            {canSwitch && !isRecording && (
              <button
                type="button"
                onClick={() => setFacing((current) => (current === 'environment' ? 'user' : 'environment'))}
                aria-label="Cambiar de cámara"
                className="grid place-items-center w-12 h-12"
              >
                <SwitchCamera className="w-7 h-7" aria-hidden="true" />
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  );
};
