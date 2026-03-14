import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  url: string;
  onWatched?: () => void;
}

const VideoPlayer = ({ url, onWatched }: VideoPlayerProps) => {
  const [playing, setPlaying] = useState(false);

  if (!url) return null;

  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  const embedUrl = isYoutube
    ? url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
    : url;

  if (!playing) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2 mt-2"
        onClick={() => setPlaying(true)}
      >
        <Play className="h-3.5 w-3.5" /> Watch Video
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-lg overflow-hidden aspect-video">
      {isYoutube ? (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => onWatched?.()}
        />
      ) : (
        <video
          src={url}
          controls
          className="w-full h-full"
          onEnded={() => onWatched?.()}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
