"use client";

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Ban, Home, RotateCcw, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import { motion } from 'framer-motion';

interface ErrorFallbackProps {
  statusCode?: 400 | 401 | 403 | 404 | 500 | 502 | 503 | 504;
  message?: string;
  resetError?: () => void;
}

export default function ErrorFallback({
  statusCode = 500,
  message,
  resetError,
}: ErrorFallbackProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(10);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-redirect for 401 and 403 errors
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if ((statusCode === 401 || statusCode === 403) && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if ((statusCode === 401 || statusCode === 403) && countdown === 0) {
      navigate('/login');
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [statusCode, countdown, navigate]);

  const getErrorData = () => {
    switch (statusCode) {
      case 400:
        return {
          title: "Bad Request",
          description: message || "There was a problem with your request. Please check your input and try again.",
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          actions: [
            {
              label: "Go Back",
              icon: <ArrowLeft className="mr-2 h-4 w-4" />,
              onClick: () => navigate(-1)
            },
            {
              label: "Home",
              icon: <Home className="mr-2 h-4 w-4" />,
              onClick: () => navigate('/weather/dashboard')
            }
          ]
        };
      case 401:
        return {
          title: "Unauthorized Access",
          description: message || `You need to be signed in to access this page. Redirecting in ${countdown} seconds...`,
          icon: <ShieldAlert className="h-12 w-12 text-red-500" />,
          actions: [
            {
              label: "Sign In",
              icon: <ArrowLeft className="mr-2 h-4 w-4" />,
              onClick: () => navigate('/login', { state: { from: location.pathname } })
            }
          ]
        };
      case 403:
        return {
          title: "Access Forbidden",
          description: message || `You don't have permission to access this page. Redirecting in ${countdown} seconds...`,
          icon: <Ban className="h-12 w-12 text-red-500" />,
          actions: [
            {
              label: "Go Back",
              icon: <ArrowLeft className="mr-2 h-4 w-4" />,
              onClick: () => navigate(-1)
            },
            {
              label: "Home",
              icon: <Home className="mr-2 h-4 w-4" />,
              onClick: () => navigate('/weather/dashboard')
            }
          ]
        };
      case 404:
        return {
          title: "Page Not Found",
          description: message || "The page you're looking for doesn't exist or has been moved.",
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          actions: [
            {
              label: "Go Back",
              icon: <ArrowLeft className="mr-2 h-4 w-4" />,
              onClick: () => navigate(-1)
            },
            {
              label: "Home",
              icon: <Home className="mr-2 h-4 w-4" />,
              onClick: () => navigate('/weather/dashboard')
            }
          ]
        };
      case 502:
      case 503:
      case 504:
        return {
          title: "Service Unavailable",
          description: message || "Our servers are currently unavailable. We're working on it and should be back shortly.",
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          actions: [
            {
              label: "Retry",
              icon: <RotateCcw className="mr-2 h-4 w-4" />,
              onClick: resetError || (() => window.location.reload())
            }
          ]
        };
      case 500:
      default:
        return {
          title: "Something Went Wrong",
          description: message || "We're experiencing some technical issues. Please try again later.",
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          actions: [
            {
              label: "Try Again",
              icon: <RotateCcw className="mr-2 h-4 w-4" />,
              onClick: resetError || (() => window.location.reload())
            },
            {
              label: "Home",
              icon: <Home className="mr-2 h-4 w-4" />,
              onClick: () => navigate('/weather/dashboard')
            }
          ]
        };
    }
  };

  const errorData = getErrorData();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.5
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <motion.div 
        className="w-full max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="py-4 shadow-lg border border-border/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <CardHeader>
            <motion.div variants={itemVariants} className="flex items-center justify-center mb-2">
              {!isOnline ? (
                <WifiOff className="h-12 w-12 text-red-500" />
              ) : (
                errorData.icon
              )}
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-center text-2xl">
                {!isOnline ? "No Internet Connection" : errorData.title}
              </CardTitle>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <motion.p 
              variants={itemVariants}
              className="text-center text-muted-foreground mb-6"
            >
              {!isOnline 
                ? "You're offline. Please check your connection and try again."
                : errorData.description
              }
            </motion.p>
            
            {statusCode === 500 && (
              <motion.div 
                variants={itemVariants}
                className="bg-muted/40 rounded-lg p-3 mb-4 text-sm text-muted-foreground border border-border"
              >
                <p>Technical Information:</p>
                <pre className="mt-1 overflow-auto">
                  <code>Error 500: Internal Server Error</code>
                </pre>
              </motion.div>
            )}
            
            {!isOnline && (
              <motion.div 
                variants={itemVariants}
                className="flex items-center justify-center space-x-2 mb-4"
              >
                <div 
                  className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} 
                />
                <span className="text-sm font-medium">
                  {isOnline ? "Back Online" : "Offline"}
                </span>
              </motion.div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
            {!isOnline ? (
              <motion.div variants={itemVariants}>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  <Wifi className="mr-2 h-4 w-4" />
                  Check Connection
                </Button>
              </motion.div>
            ) : (
              errorData.actions.map((action, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Button 
                    variant={index === 0 ? "default" : "outline"} 
                    onClick={action.onClick}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                </motion.div>
              ))
            )}
          </CardFooter>
        </Card>
        
        <motion.div 
          variants={itemVariants}
          className="text-center mt-6 text-sm text-muted-foreground"
        >
          <p>
            Need help? Contact our&nbsp;
            <a 
              href="mailto:support@weatherapp.com" 
              className="text-primary hover:underline"
            >
              support team
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
