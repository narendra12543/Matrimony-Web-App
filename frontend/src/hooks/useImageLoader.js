import { useState, useEffect } from "react";
import { getImageUrl } from "../utils/imageUtils";

export const useImageLoader = (imagePath, maxRetries = 3) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!imagePath) {
      setIsLoading(false);
      setError("No image path provided");
      return;
    }

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try with force refresh first for newly uploaded images
        const url = getImageUrl(imagePath, retryCount === 0);

        const img = new Image();
        img.onload = () => {
          setImageUrl(url);
          setIsLoading(false);
          setError(null);
        };

        img.onerror = () => {
          if (retryCount < maxRetries) {
            // Retry without force refresh
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
          } else {
            setError("Failed to load image");
            setIsLoading(false);
          }
        };

        img.src = url;
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [imagePath, retryCount, maxRetries]);

  const retry = () => {
    setRetryCount(0);
  };

  return { imageUrl, isLoading, error, retry };
};
