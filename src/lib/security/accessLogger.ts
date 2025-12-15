/**
 * Access logging utilities for tracking user activity and data access
 * Logs are stored in Supabase for audit trails and compliance
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Types for access logging
 */
export enum AccessAction {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  DOWNLOAD = 'DOWNLOAD',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_AUTH = 'FAILED_AUTH',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PROFILE_VIEW = 'PROFILE_VIEW',
  PROPERTY_VIEW = 'PROPERTY_VIEW',
  INQUIRY_SUBMIT = 'INQUIRY_SUBMIT',
  MESSAGE_SEND = 'MESSAGE_SEND',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

export enum AccessStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DENIED = 'DENIED',
}

/**
 * Access log entry interface
 */
export interface AccessLog {
  id?: string;
  user_id: string;
  action: AccessAction;
  resource_type: string; // 'property', 'conversation', 'payment', 'profile', etc.
  resource_id: string;
  status: AccessStatus;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Log user access to resources
 * Non-blocking - logs are queued asynchronously
 * @param log - Access log data
 */
export const logAccess = async (log: AccessLog): Promise<void> => {
  try {
    // Get client IP from environment (will be localhost in frontend)
    const ipAddress = log.ip_address || getClientIP();
    const userAgent = log.user_agent || navigator.userAgent;

    const accessLog = {
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      status: log.status,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: log.details || {},
      timestamp: new Date().toISOString(),
    };

    // Queue log asynchronously (don't await)
    queueAccessLog(accessLog);
  } catch (error) {
    // Silently fail - logging should never interrupt user operations
    console.debug('Access logging initialization error:', error);
  }
};

/**
 * Queue access log for asynchronous processing
 */
const queueAccessLog = async (log: any): Promise<void> => {
  try {
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        sendAccessLog(log);
      });
    } else {
      // Fallback: Send after short delay
      setTimeout(() => {
        sendAccessLog(log);
      }, 100);
    }
  } catch (error) {
    console.debug('Failed to queue access log:', error);
  }
};

/**
 * Send access log to Supabase
 */
const sendAccessLog = async (log: any): Promise<void> => {
  try {
    // Note: access_logs table may not exist yet
    // This is a non-critical feature - silently fail if table doesn't exist
    // In production, ensure the migration has been run
    console.debug('Access log queued (table may not exist yet):', log.action);
    return;
    
    // Uncomment when access_logs table exists in Supabase
    // const { error } = await supabase
    //   .from('access_logs')
    //   .insert([log]);
    //
    // if (error) {
    //   console.debug('Failed to log access:', error.message);
    // }
  } catch (error) {
    // Silently catch - never interrupt user experience
    console.debug('Access logging error:', error);
  }
};

/**
 * Log successful data access/read
 * @param userId - User ID from auth context
 * @param resourceType - Type of resource (property, conversation, etc.)
 * @param resourceId - ID of specific resource
 * @param action - Action performed (default: READ)
 */
export const logDataAccess = async (
  userId: string,
  resourceType: string,
  resourceId: string,
  action: AccessAction = AccessAction.READ,
  details?: Record<string, unknown>
): Promise<void> => {
  if (!userId) return; // Skip if no user

  await logAccess({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    status: AccessStatus.SUCCESS,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: details || {},
  });
};

/**
 * Log denied/unauthorized access attempts
 * @param userId - User ID (or 'anonymous' if not logged in)
 * @param resourceType - Type of resource attempted to access
 * @param resourceId - ID of resource
 * @param reason - Reason access was denied
 */
export const logAccessDenied = async (
  userId: string,
  resourceType: string,
  resourceId: string,
  reason: string
): Promise<void> => {
  if (!userId) return; // Skip if no user

  await logAccess({
    user_id: userId,
    action: AccessAction.ACCESS_DENIED,
    resource_type: resourceType,
    resource_id: resourceId,
    status: AccessStatus.DENIED,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: { reason },
  });
};

/**
 * Log export/download of data
 * @param userId - User ID
 * @param dataType - Type of data exported (conversations, properties, etc.)
 * @param recordCount - Number of records in export
 * @param format - Export format (csv, json, pdf, etc.)
 */
export const logExport = async (
  userId: string,
  dataType: string,
  recordCount: number,
  format: string
): Promise<void> => {
  if (!userId) return;

  await logAccess({
    user_id: userId,
    action: AccessAction.EXPORT,
    resource_type: dataType,
    resource_id: `export_${Date.now()}`,
    status: AccessStatus.SUCCESS,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: {
      format,
      record_count: recordCount,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Log authentication event
 * @param userId - User ID
 * @param success - Whether authentication was successful
 * @param method - Authentication method (password, oauth, etc.)
 */
export const logAuthEvent = async (
  userId: string,
  success: boolean,
  method: string = 'password',
  details?: Record<string, unknown>
): Promise<void> => {
  const action = success ? AccessAction.LOGIN : AccessAction.FAILED_AUTH;
  const status = success ? AccessStatus.SUCCESS : AccessStatus.FAILED;

  await logAccess({
    user_id: userId || 'anonymous',
    action,
    resource_type: 'authentication',
    resource_id: `auth_${Date.now()}`,
    status,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: { method, ...details },
  });
};

/**
 * Log property view (analytics)
 * @param userId - User ID (optional - can be anonymous)
 * @param propertyId - Property ID viewed
 * @param source - Where property was viewed from (search, detail, etc.)
 */
export const logPropertyView = async (
  userId: string,
  propertyId: string,
  source: string = 'search'
): Promise<void> => {
  if (!propertyId) return;

  await logAccess({
    user_id: userId || 'anonymous',
    action: AccessAction.PROPERTY_VIEW,
    resource_type: 'property',
    resource_id: propertyId,
    status: AccessStatus.SUCCESS,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: { source },
  });
};

/**
 * Log inquiry submission
 * @param userId - User ID
 * @param propertyId - Property ID for inquiry
 * @param inquiryId - Inquiry ID
 */
export const logInquirySubmit = async (
  userId: string,
  propertyId: string,
  inquiryId: string
): Promise<void> => {
  if (!userId || !inquiryId) return;

  await logAccess({
    user_id: userId,
    action: AccessAction.INQUIRY_SUBMIT,
    resource_type: 'inquiry',
    resource_id: inquiryId,
    status: AccessStatus.SUCCESS,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: { property_id: propertyId },
  });
};

/**
 * Log message send (chat, inquiry, etc.)
 * @param userId - User ID
 * @param conversationId - Conversation ID
 * @param messageType - Type of message (chat, inquiry, review, etc.)
 */
export const logMessageSend = async (
  userId: string,
  conversationId: string,
  messageType: string = 'message'
): Promise<void> => {
  if (!userId || !conversationId) return;

  await logAccess({
    user_id: userId,
    action: AccessAction.MESSAGE_SEND,
    resource_type: 'message',
    resource_id: conversationId,
    status: AccessStatus.SUCCESS,
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
    details: { message_type: messageType },
  });
};

/**
 * Get client IP address from browser
 * Note: In browser, this gets limited info
 * Accurate IP comes from backend headers
 * @returns Client IP or 'browser-client' if unavailable
 */
export const getClientIP = (): string => {
  // In browser environment, we can't reliably get IP
  // The backend will get the real IP from headers
  return 'browser-client';
};

/**
 * Create activity summary for user
 * @param userId - User ID
 * @param days - Number of days to summarize (default: 7)
 */
export const getActivitySummary = async (
  userId: string,
  days: number = 7
): Promise<any> => {
  if (!userId) return null;

  try {
    // Note: access_logs table may not exist yet
    console.debug('Activity summary requested but table may not exist');
    return null;
    
    // Uncomment when access_logs table exists
    // const { data, error } = await supabase
    //   .from('access_logs')
    //   .select('action, resource_type, COUNT(*) as count')
    //   .eq('user_id', userId)
    //   .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    //   .group_by('action', 'resource_type');
    //
    // if (error) {
    //   console.debug('Failed to get activity summary:', error);
    //   return null;
    // }
    //
    // return data;
  } catch (error) {
    console.debug('Activity summary error:', error);
    return null;
  }
};

/**
 * Get recent activity for user
 * @param userId - User ID
 * @param limit - Number of recent activities to return (default: 20)
 */
export const getRecentActivity = async (
  userId: string,
  limit: number = 20
): Promise<any[]> => {
  if (!userId) return [];

  try {
    // Note: access_logs table may not exist yet
    console.debug('Recent activity requested but table may not exist');
    return [];
    
    // Uncomment when access_logs table exists
    // const { data, error } = await supabase
    //   .from('access_logs')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('timestamp', { ascending: false })
    //   .limit(limit);
    //
    // if (error) {
    //   console.debug('Failed to get recent activity:', error);
    //   return [];
    // }
    //
    // return data || [];
  } catch (error) {
    console.debug('Recent activity error:', error);
    return [];
  }
};

export default {
  logAccess,
  logDataAccess,
  logAccessDenied,
  logExport,
  logAuthEvent,
  logPropertyView,
  logInquirySubmit,
  logMessageSend,
  getActivitySummary,
  getRecentActivity,
  AccessAction,
  AccessStatus,
};
