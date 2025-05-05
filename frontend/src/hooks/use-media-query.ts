import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Update state on mount in case it changes between render and effect
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    // Use the newer addEventListener when available
    const listener = () => setMatches(media.matches);
    
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query, matches]);

  return matches;
}