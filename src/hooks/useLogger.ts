import { useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

export const useLogger = (componentName: string) => {
  const { user } = useAuth();
  const mountTimeRef = useRef<Date>();

  useEffect(() => {
    mountTimeRef.current = new Date();
    logger.componentMount(componentName, { userId: user?.id });

    return () => {
      const unmountTime = new Date();
      const duration = mountTimeRef.current 
        ? unmountTime.getTime() - mountTimeRef.current.getTime()
        : 0;
      
      logger.componentUnmount(componentName);
      logger.debug('Component', `${componentName} was mounted for ${duration}ms`);
    };
  }, [componentName, user?.id]);

  const logUserAction = (action: string, target: string, data?: any) => {
    logger.userAction(action, target, data, user?.id);
  };

  const logApiCall = (method: string, endpoint: string, data?: any) => {
    logger.apiCall(method, endpoint, data, user?.id);
  };

  const logApiResponse = (method: string, endpoint: string, status: number, data?: any) => {
    logger.apiResponse(method, endpoint, status, data, user?.id);
  };

  const logError = (message: string, error?: any) => {
    logger.error(componentName, message, error, user?.id);
  };

  const logInfo = (message: string, data?: any) => {
    logger.info(componentName, message, data, user?.id);
  };

  const logDebug = (message: string, data?: any) => {
    logger.debug(componentName, message, data, user?.id);
  };

  return {
    logUserAction,
    logApiCall,
    logApiResponse,
    logError,
    logInfo,
    logDebug
  };
};