import React, { useState, useEffect } from "react";
import { getImageUrl } from "../utils/imageUtils";

const ImageLoader = ({
  src,
  alt,
  className,
  fallbackSrc = "/default-avatar.svg",
  onLoad,
  onError,
  retryCount = 3,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!src) {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    const loadImage = () => {
      setIsLoading(true);
      setError(false);

      const img = new Image();

      img.onload = () => {
        setImageSrc(img.src);
        setIsLoading(false);
        setError(false);
        onLoad?.(img);
      };

      img.onerror = () => {
        if (retries < retryCount) {
          // Retry with different strategies
          setTimeout(() => {
            setRetries((prev) => prev + 1);
          }, 1000 * (retries + 1));
        } else {
          setError(true);
          setIsLoading(false);
          setImageSrc(fallbackSrc);
          onError?.(new Error("Failed to load image"));
        }
      };

      // Try with force refresh on first attempt
      const url = getImageUrl(src, retries === 0);
      img.src = url;
    };

    loadImage();
  }, [src, retries, retryCount, fallbackSrc, onLoad, onError]);

  // Listen for profile image updates and force refresh
  useEffect(() => {
    const handleImageUpdate = () => {
      if (src) {
        setRetries(0);
        setError(false);
        setIsLoading(true);

        const img = new Image();
        img.onload = () => {
          setImageSrc(img.src);
          setIsLoading(false);
        };
        img.onerror = () => {
          setIsLoading(false);
          setError(true);
        };

        // Force refresh with timestamp
        const url = getImageUrl(src, true);
        img.src = url;
      }
    };

    window.addEventListener("profileImagesUpdated", handleImageUpdate);
    return () =>
      window.removeEventListener("profileImagesUpdated", handleImageUpdate);
  }, [src]);

  const handleRetry = () => {
    setRetries(0);
    setError(false);
  };

  if (isLoading) {
    return (
      <div
        className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && imageSrc === fallbackSrc) {
    return <img src={fallbackSrc} alt={alt} className={className} {...props} />;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleRetry}
      {...props}
    />
  );
};

export default ImageLoader;
