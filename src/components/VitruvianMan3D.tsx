import React from 'react';
import {
  PhotographicAvatarViewer25D,
  type PhotographicAvatarViewerHandle,
  type PhotographicAvatarViewerProps,
} from './PhotographicAvatarViewer25D';

export type VitruvianMan3DHandle = PhotographicAvatarViewerHandle;
export type VitruvianMan3DProps = PhotographicAvatarViewerProps;

export const VitruvianMan3D = React.forwardRef<VitruvianMan3DHandle, VitruvianMan3DProps>(
  (props, ref) => <PhotographicAvatarViewer25D ref={ref} {...props} />
);

VitruvianMan3D.displayName = 'VitruvianMan3D';
