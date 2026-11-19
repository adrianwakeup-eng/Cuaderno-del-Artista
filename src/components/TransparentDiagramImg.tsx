import React, { memo, useEffect, useState } from 'react';
import {
  getCachedTransparentDiagram,
  processTransparentDiagram,
} from '../utils/diagramProcessor';

interface TransparentDiagramImgProps {
  src: string;
  alt: string;
  enabled?: boolean;
  maxDim?: number;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export const TransparentDiagramImg: React.FC<TransparentDiagramImgProps> = memo(
  ({
    src,
    alt,
    enabled = true,
    maxDim = 960,
    className = '',
    style,
    draggable = false,
    loading,
    decoding = 'async',
    referrerPolicy,
  }) => {
    const [processedSrc, setProcessedSrc] = useState<string | null>(() =>
      enabled ? getCachedTransparentDiagram(src, maxDim) : null
    );

    useEffect(() => {
      if (!enabled) {
        setProcessedSrc(null);
        return;
      }

      const cached = getCachedTransparentDiagram(src, maxDim);
      if (cached) {
        setProcessedSrc(cached);
        return;
      }

      let cancelled = false;
      setProcessedSrc(null);
      void processTransparentDiagram(src, maxDim).then((out) => {
        if (!cancelled) {
          setProcessedSrc(out);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [src, enabled, maxDim]);

    const resolvedSrc = enabled ? processedSrc || src : src;
    const isFallbackPending = enabled && !processedSrc;

    // While the ~15ms canvas pass runs on first view, use multiply + contrast/saturate so there is zero white flash
    const fallbackStyle: React.CSSProperties | undefined = isFallbackPending
      ? {
          mixBlendMode: 'multiply',
          filter: `${style?.filter ? `${style.filter} ` : ''}brightness(1.06) contrast(1.38) saturate(1.6)`,
        }
      : undefined;

    return (
      <img
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        draggable={draggable}
        referrerPolicy={referrerPolicy}
        style={fallbackStyle ? { ...style, ...fallbackStyle } : style}
        className={className}
      />
    );
  }
);
