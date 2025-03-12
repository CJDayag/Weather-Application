import { useEffect, useState } from "react";

interface ProgressBarProps {
  isLoading: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (isLoading) {
      setProgress(10); // Start progress at 10%
      timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 300); // Gradually increase to 90%
    } else {
      setProgress(100); // Finish progress
      const timeout = setTimeout(() => setProgress(0), 500); // Reset after completion
      return () => clearTimeout(timeout);
    }

    return () => clearInterval(timer);
  }, [isLoading]);

  // Hide the progress bar completely when progress is 0.
  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-300 z-50">
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;