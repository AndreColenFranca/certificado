import React from 'react';
import { HighResPhotoInspector } from './HighResPhotoInspector';

export { HighResPhotoInspector };

// Re-export Inspector360 pointing to HighResPhotoInspector for full compatibility
export const Inspector360: React.FC<{
  frames: string[];
  title: string;
  serialNumber: string;
  metalPurity: string;
  hasStones: boolean;
  primaryStoneType?: string;
  authenticityHash?: string;
}> = (props) => {
  return (
    <HighResPhotoInspector
      images={props.frames}
      title={props.title}
      serialNumber={props.serialNumber}
      metalPurity={props.metalPurity}
      hasStones={props.hasStones}
      primaryStoneType={props.primaryStoneType}
      authenticityHash={props.authenticityHash}
    />
  );
};
