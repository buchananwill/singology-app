import type { ReactNode } from "react";

import { PlayerProvider } from "./PlayerProvider";
import { WaveformPlayer, type WaveformPlayerProps } from "./WaveformPlayer";

export interface StandalonePlayerProps extends WaveformPlayerProps {
  /** Rendered after the player, inside its provider, e.g. a `CommentList`. */
  children?: ReactNode;
}

export function StandalonePlayer({ children, ...player }: StandalonePlayerProps) {
  return (
    <PlayerProvider>
      <WaveformPlayer {...player} />
      {children}
    </PlayerProvider>
  );
}
