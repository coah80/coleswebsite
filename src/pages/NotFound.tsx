import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-ctp-base flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl text-ctp-surface1 font-heading font-bold mb-4">404</h1>
        <p className="text-xl text-ctp-overlay1 font-body mb-4">Oops! Page not found</p>
        <a href="/" className="text-ctp-mauve hover:text-ctp-mauve/80 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
