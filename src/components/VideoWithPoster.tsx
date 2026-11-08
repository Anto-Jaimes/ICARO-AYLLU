import React from 'react';
import { useFirstFrame, VIDEO_PRELOAD } from '../hooks/useFirstFrame';

type Props = Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'poster' | 'preload'> & { src: string };

/** A video that shows its first frame before it plays, in the browser and in the Android app alike. */
export const VideoWithPoster: React.FC<Props> = ({ src, ...rest }) => {
  const poster = useFirstFrame(src);
  return <video src={src} poster={poster} preload={VIDEO_PRELOAD} {...rest} />;
};
