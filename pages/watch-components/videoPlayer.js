import React, { useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default function VideoPlayer({ vidId }) {
  useEffect(() => {
    const player = videojs('my-video', {
      controls: true,
      autoplay: true,
      preload: 'auto',
      fluid: true,
      sources: [{
        src: `http://localhost:5050/api/video/${vidId}.m3u8`,
        type: 'application/x-mpegURL',
      }],
    });

    return () => {
      if (player) {
        player.dispose();
      }
    };
  }, [vidId]);

  return (
    <div className='m-2'>
      <video id="my-video" className="video-js vjs-default-skin rounded-lg"></video>
    </div>
  );
}