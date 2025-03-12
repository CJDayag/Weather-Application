// components/RouteChangeProgress.tsx
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";

const RouteChangeProgress: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800); // Simulate loading time
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return <ProgressBar isLoading={isLoading} />;
};

export default RouteChangeProgress;
