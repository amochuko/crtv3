import { fullLivepeer } from '@app/lib/sdk/livepeer/fullClient';
import { getSrc } from '@livepeer/react/external';
import { Src } from '@livepeer/react';
import { LIVEPEER_FEATURED_PLAYBACK_ID } from '../context';

const playbackId = LIVEPEER_FEATURED_PLAYBACK_ID;

export const getFeaturedPlaybackSource = async (): Promise<Src[] | null> => {
  try {
    const playbackInfo = await fullLivepeer.playback.get(playbackId);
    const src = getSrc(playbackInfo?.playbackInfo) as Src[];
    return src;
  } catch (error) {
    console.error('Error fetching playback source:', error);
    return null;
  }
};