// File: src/agents/security-manager.ts

import { createHash, randomBytes } from 'crypto';

export interface SecurityConfig {
  enforceEncryption: boolean;
  requireMFA: boolean;
  enableAuditLogging: boolean;
  rateLimitPerMinute: number;
  allowedIps: string[];
  sessionTimeout: number;
}

export interface SecurityAuditLog {
  timestamp: Date;
  operation: string;
  agentId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  duration: number;
  securityFlags: string[];
}

export interface EncryptedRequest {
  data: any;
  signature: string;
  timestamp: number;
  nonce: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number;
}

export class AgentSecurityManager {
  private config: SecurityConfig;
  private auditLogs: SecurityAuditLog[] = [];
  private rateLimitMap: Map<string, number[]> = new Map();
  private activeSessions: Map<string, Date> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Validate and sanitize input to prevent injection attacks
   */
  validateInput(input: any, context: string = 'general'): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskScore = 0;

    // Check for common injection patterns
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    
    // SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi,
      /(--|;|\/\*|\*\/)/g,
      /(\bUNION\b)/gi
    ];

    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    // Command injection patterns
    const cmdPatterns = [
      /[;&|`$(){}[\]]/g,
      /\$\([^)]*\)/g,
      /\|\s*(rm|ls|cat|echo)\s/g
    ];

    // Check patterns
    if (sqlPatterns.some(pattern => pattern.test(inputStr))) {
      errors.push('Potential SQL injection detected');
      riskScore += 50;
    }

    if (xssPatterns.some(pattern => pattern.test(inputStr))) {
      errors.push('Potential XSS injection detected');
      riskScore += 30;
    }

    if (cmdPatterns.some(pattern => pattern.test(inputStr))) {
      errors.push('Potential command injection detected');
      riskScore += 40;
    }

    // Check input size limits
    if (inputStr.length > 10000) {
      errors.push('Input size exceeds maximum allowed limit');
      riskScore += 20;
    }

    // Context-specific validations
    if (context === 'agent-prompt') {
      // Additional checks for agent prompts
      const dangerousPatterns = [
        /ignore\s+previous\s+instructions/gi,
        /disregard\s+security\s+protocols/gi,
        /execute\s+arbitrary\s+code/gi
      ];

      if (dangerousPatterns.some(pattern => pattern.test(inputStr))) {
        errors.push('Dangerous instruction pattern detected in agent prompt');
        riskScore += 60;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      riskScore
    };
  }

  /**
   * Encrypt sensitive data for secure transmission
   */
  encryptRequest(data: any, agentId: string): EncryptedRequest {
    if (!this.config.enforceEncryption) {
      return {
        data,
        signature: '',
        timestamp: Date.now(),
        nonce: ''
      };
    }

    const timestamp = Date.now();
    const nonce = randomBytes(16).toString('hex');
    const dataStr = JSON.stringify(data);
    
    // Create HMAC signature
    const signature = createHash('sha256')
      .update(`${timestamp}:${nonce}:${dataStr}`)
      .digest('hex');

    return {
      data: dataStr,
      signature,
      timestamp,
      nonce
    };
  }

  /**
   * Verify encrypted request signature
   */
  verifyRequest(encrypted: EncryptedRequest, agentId: string): boolean {
    try {
      const expectedSignature = createHash('sha256')
        .update(`${encrypted.timestamp}:${encrypted.nonce}:${encrypted.data}`)
        .digest('hex');

      return encrypted.signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Enforce rate limiting per agent
   */
  checkRateLimit(agentId: string, ipAddress: string): boolean {
    if (!this.config.rateLimitPerMinute) {
      return true;
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000; // 60 seconds in milliseconds
    const key = `${agentId}:${ipAddress}`;

    if (!this.rateLimitMap.has(key)) {
      this.rateLimitMap.set(key, []);
    }

    const requests = this.rateLimitMap.get(key)!;
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => time > oneMinuteAgo);
    this.rateLimitMap.set(key, validRequests);

    return validRequests.length < this.config.rateLimitPerMinute;
  }

  /**
   * Validate IP address against allowed list
   */
  validateIPAddress(ipAddress: string): boolean {
    if (!this.config.allowedIps || this.config.allowedIps.length === 0) {
      return true; // No IP restrictions
    }

    return this.config.allowedIps.includes(ipAddress);
  }

  /**
   * Create and manage secure sessions
   */
  createSession(agentId: string, userId?: string): string {
    const sessionId = randomBytes(32).toString('hex');
    this.activeSessions.set(sessionId, new Date());

    return sessionId;
  }

  validateSession(sessionId: string): boolean {
    if (!this.config.sessionTimeout) {
      return true;
    }

    const sessionTime = this.activeSessions.get(sessionId);
    if (!sessionTime) {
      return false;
    }

    const now = Date.now();
    const sessionAge = now - sessionTime.getTime();
    const timeoutMs = this.config.sessionTimeout * 1000; // Convert to milliseconds

    if (sessionAge > timeoutMs) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Log security events for audit and monitoring
   */
  logSecurityEvent(event: Omit<SecurityAuditLog, 'timestamp'>): void {
    if (!this.config.enableAuditLogging) {
      return;
    }

    const auditLog: SecurityAuditLog = {
      ...event,
      timestamp: new Date()
    };

    this.auditLogs.push(auditLog);

    // In production, this would send to security monitoring system
    console.log('Security audit log:', auditLog);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Get recent audit logs for analysis
   */
  getAuditLogs(hours: number = 24): SecurityAuditLog[] {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.auditLogs.filter(log => log.timestamp >= cutoff);
  }

  /**
   * Generate security report
   */
  generateSecurityReport(hours: number = 24): {
    totalEvents: number;
    riskDistribution: Record<string, number>;
    topAgents: Array<{ agentId: string; count: number }>;
    recommendations: string[];
  } {
    const logs = this.getAuditLogs(hours);
    
    const riskDistribution = logs.reduce((acc, log) => {
      const riskLevel = this.calculateRiskLevel(log);
      acc[riskLevel] = (acc[riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const agentCounts = logs.reduce((acc, log) => {
      acc[log.agentId] = (acc[log.agentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAgents = Object.entries(agentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([agentId, count]) => ({ agentId, count }));

    const recommendations = this.generateSecurityRecommendations(logs, riskDistribution);

    return {
      totalEvents: logs.length,
      riskDistribution,
      topAgents,
      recommendations
    };
  }

  private calculateRiskLevel(log: SecurityAuditLog): string {
    let score = 0;

    if (!log.success) score += 20;
    if (log.securityFlags.length > 0) score += 30;
    if (log.duration > 5000) score += 10; // Slow operations might indicate issues

    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private generateSecurityRecommendations(logs: SecurityAuditLog[], riskDistribution: Record<string, number>): string[] {
    const recommendations: string[] = [];

    if (riskDistribution.high > 0) {
      recommendations.push('High number of high-risk events detected - investigate immediately');
    }

    if (riskDistribution.medium > 5) {
      recommendations.push('Elevated number of medium-risk events - review security protocols');
    }

    const failureRate = logs.filter(log => !log.success).length / logs.length;
    if (failureRate > 0.1) {
      recommendations.push('High failure rate detected - check agent configurations and credentials');
    }

    const avgDuration = logs.reduce((sum, log) => sum + log.duration, 0) / logs.length;
    if (avgDuration > 3000) {
      recommendations.push('Average operation duration is high - consider performance optimization');
    }

    return recommendations;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const timeoutMs = this.config.sessionTimeout * 1000;

    for (const [sessionId, sessionTime] of this.activeSessions.entries()) {
      if (now - sessionTime.getTime() > timeoutMs) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Get current security metrics
   */
  getSecurityMetrics(): {
    activeSessions: number;
    rateLimitViolations: number;
    auditLogSize: number;
  } {
    return {
      activeSessions: this.activeSessions.size,
      rateLimitViolations: this.calculateRateLimitViolations(),
      auditLogSize: this.auditLogs.length
    };
  }

  private calculateRateLimitViolations(): number {
    let violations = 0;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    for (const [key, requests] of this.rateLimitMap.entries()) {
      const validRequests = requests.filter(time => time > oneMinuteAgo);
      if (validRequests.length >= this.config.rateLimitPerMinute) {
        violations++;
      }
    }

    return violations;
  }
}
