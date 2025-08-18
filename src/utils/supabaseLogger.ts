import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

type SupabaseMethod = 'select' | 'insert' | 'update' | 'delete' | 'upsert' | 'rpc';

export const createLoggedSupabaseClient = (supabase: SupabaseClient) => {
  const originalFrom = supabase.from.bind(supabase);
  const originalRpc = supabase.rpc.bind(supabase);
  const originalFunctions = supabase.functions;

  // Wrap the from() method to add logging
  supabase.from = (table: string) => {
    const queryBuilder = originalFrom(table);
    
    // Override query methods to add logging
    const originalMethods = {
      select: queryBuilder.select.bind(queryBuilder),
      insert: queryBuilder.insert.bind(queryBuilder),
      update: queryBuilder.update.bind(queryBuilder),
      delete: queryBuilder.delete.bind(queryBuilder),
      upsert: queryBuilder.upsert.bind(queryBuilder),
    };

    const logQuery = (method: SupabaseMethod, params?: any) => {
      logger.apiCall(method.toUpperCase(), `table:${table}`, params);
    };

    const logResponse = (method: SupabaseMethod, result: any) => {
      const status = result.error ? 400 : 200;
      logger.apiResponse(method.toUpperCase(), `table:${table}`, status, {
        error: result.error,
        count: result.data?.length || 0
      });
    };

    // Wrap each method
    queryBuilder.select = (...args: any[]) => {
      logQuery('select', args[0]);
      const promise = originalMethods.select(...args);
      promise.then((result: any) => logResponse('select', result));
      return promise;
    };

    queryBuilder.insert = (...args: any[]) => {
      logQuery('insert', { recordCount: Array.isArray(args[0]) ? args[0].length : 1 });
      const promise = originalMethods.insert(...args);
      promise.then((result: any) => logResponse('insert', result));
      return promise;
    };

    queryBuilder.update = (...args: any[]) => {
      logQuery('update', args[0]);
      const promise = originalMethods.update(...args);
      promise.then((result: any) => logResponse('update', result));
      return promise;
    };

    queryBuilder.delete = () => {
      logQuery('delete');
      const promise = originalMethods.delete();
      promise.then((result: any) => logResponse('delete', result));
      return promise;
    };

    queryBuilder.upsert = (...args: any[]) => {
      logQuery('upsert', { recordCount: Array.isArray(args[0]) ? args[0].length : 1 });
      const promise = originalMethods.upsert(...args);
      promise.then((result: any) => logResponse('upsert', result));
      return promise;
    };

    return queryBuilder;
  };

  // Wrap the rpc() method
  supabase.rpc = (functionName: string, params?: any) => {
    logger.apiCall('RPC', `function:${functionName}`, params);
    const promise = originalRpc(functionName, params);
    promise.then((result: any) => {
      const status = result.error ? 400 : 200;
      logger.apiResponse('RPC', `function:${functionName}`, status, {
        error: result.error,
        result: result.data
      });
    });
    return promise;
  };

  // Wrap the functions.invoke() method
  const originalInvoke = originalFunctions.invoke.bind(originalFunctions);
  supabase.functions.invoke = (functionName: string, options?: any) => {
    logger.apiCall('INVOKE', `edge-function:${functionName}`, options?.body);
    const promise = originalInvoke(functionName, options);
    promise.then((result: any) => {
      const status = result.error ? 400 : 200;
      logger.apiResponse('INVOKE', `edge-function:${functionName}`, status, {
        error: result.error,
        data: result.data
      });
    });
    return promise;
  };

  return supabase;
};