"use client";

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Home, Search } from "lucide-react";
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();
  
  // Track 404 errors
  useEffect(() => {
    // Here you could log the 404 error to an analytics service
    console.log('404 page not found:', window.location.pathname);
  }, []);

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
        <Card className="shadow-lg border border-border/80 backdrop-blur-sm overflow-hidden py-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <CardHeader>
            <motion.div variants={itemVariants} className="flex items-center justify-center mb-2">
              <div className="relative">
                <div className="text-[120px] font-bold text-muted-foreground/10">404</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500" />
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-center text-2xl">Page Not Found</CardTitle>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <motion.p 
              variants={itemVariants}
              className="text-center text-muted-foreground mb-6"
            >
              We couldn't find the page you were looking for. The page might have been removed,
              renamed, or is temporarily unavailable.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="bg-muted/40 rounded-lg p-3 mb-4 text-sm text-muted-foreground border border-border flex items-center gap-2"
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              <code className="overflow-auto">
                {window.location.pathname}
              </code>
            </motion.div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
            <motion.div variants={itemVariants}>
              <Button 
                variant="default" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button 
                variant="outline" 
                onClick={() => navigate('/weather/dashboard')}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
