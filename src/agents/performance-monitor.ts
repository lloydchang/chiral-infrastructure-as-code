// Performance monitor for agent operations
export interface AgentLatency {
  agentId: string;
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  agentMetrics: {
    [agentId: string]: {
      averageLatency: number;
      p95Latency: number;
      p99Latency: number;
      successRate: number;
      totalOperations: number;
      errors: string[];
    };
  };
  operationMetrics: {
    [operation: string]: {
      averageLatency: number;
      p95Latency: number;
      p99Latency: number;
      successRate: number;
      totalOperations: number;
    };
  };
  recommendations: string[];
}

export interface PerformanceThresholds {
  maxAverageLatency: number; // milliseconds
  maxP95Latency: number; // milliseconds
  maxP99Latency: number; // milliseconds
  minSuccessRate: number; // percentage (0-1)
  maxErrorRate: number; // percentage (0-1)
}

interface AgentMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  totalOperations: number;
  errors: string[];
}

interface OperationMetrics {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  totalOperations: number;
}

export class AgentPerformanceMonitor {
  private latencyLog: AgentLatency[] = [];
  private maxLogSize: number = 10000;
  private thresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxAverageLatency: 2000, // 2 seconds
      maxP95Latency: 5000, // 5 seconds
      maxP99Latency: 10000, // 10 seconds
      minSuccessRate: 0.95, // 95%
      maxErrorRate: 0.05, // 5%
      ...thresholds
    };
  }

  trackAgentLatency(agentId: string, operation: string, duration: number, success: boolean, errorMessage?: string): void {
    const latency: AgentLatency = {
      agentId,
      operation,
      duration,
      timestamp: new Date(),
      success,
      errorMessage
    };

    this.latencyLog.push(latency);

    // Keep log size manageable
    if (this.latencyLog.length > this.maxLogSize) {
      this.latencyLog = this.latencyLog.slice(-this.maxLogSize);
    }

    // Check for immediate threshold violations
    this.checkThresholdViolation(latency);
  }

  generatePerformanceReport(period?: { start: Date; end: Date }): PerformanceReport {
    const now = new Date();
    const defaultPeriod = {
      start: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      end: now
    };
    
    const reportPeriod = period || defaultPeriod;
    
    const filteredLatency = this.latencyLog.filter(
      latency => latency.timestamp >= reportPeriod.start && latency.timestamp <= reportPeriod.end
    );

    const agentMetrics = this.calculateAgentMetrics(filteredLatency);
    const operationMetrics = this.calculateOperationMetrics(filteredLatency);
    const recommendations = this.generatePerformanceRecommendations(agentMetrics, operationMetrics);

    return {
      period: reportPeriod,
      agentMetrics,
      operationMetrics,
      recommendations
    };
  }

  alertOnPerformanceIssues(thresholds?: Partial<PerformanceThresholds>): string[] {
    const currentThresholds = { ...this.thresholds, ...thresholds };
    const alerts: string[] = [];
    
    const recentLatency = this.latencyLog.slice(-100); // Last 100 operations
    if (recentLatency.length === 0) return alerts;

    const agentMetrics = this.calculateAgentMetrics(recentLatency);

    for (const [agentId, metrics] of Object.entries(agentMetrics)) {
      if (metrics.averageLatency > currentThresholds.maxAverageLatency) {
        alerts.push(`Agent ${agentId} average latency (${metrics.averageLatency}ms) exceeds threshold (${currentThresholds.maxAverageLatency}ms)`);
      }

      if (metrics.p95Latency > currentThresholds.maxP95Latency) {
        alerts.push(`Agent ${agentId} P95 latency (${metrics.p95Latency}ms) exceeds threshold (${currentThresholds.maxP95Latency}ms)`);
      }

      if (metrics.successRate < currentThresholds.minSuccessRate) {
        alerts.push(`Agent ${agentId} success rate (${Math.round(metrics.successRate * 100)}%) below threshold (${Math.round(currentThresholds.minSuccessRate * 100)}%)`);
      }
    }

    return alerts;
  }

  private calculateAgentMetrics(latencyData: AgentLatency[]): { [agentId: string]: AgentMetrics } {
    const agentGroups: { [agentId: string]: AgentLatency[] } = {};
    
    // Group by agent
    for (const latency of latencyData) {
      if (!agentGroups[latency.agentId]) {
        agentGroups[latency.agentId] = [];
      }
      agentGroups[latency.agentId].push(latency);
    }

    const metrics: { [agentId: string]: AgentMetrics } = {};

    for (const [agentId, latencies] of Object.entries(agentGroups)) {
      const durations = latencies.map(l => l.duration).sort((a, b) => a - b);
      const successCount = latencies.filter(l => l.success).length;
      const errors = latencies.filter(l => !l.success).map(l => l.errorMessage).filter(Boolean) as string[];

      metrics[agentId] = {
        averageLatency: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p95Latency: this.calculatePercentile(durations, 95),
        p99Latency: this.calculatePercentile(durations, 99),
        successRate: successCount / latencies.length,
        totalOperations: latencies.length,
        errors: [...new Set(errors)] // Unique errors
      };
    }

    return metrics;
  }

  private calculateOperationMetrics(latencyData: AgentLatency[]): { [operation: string]: any } {
    const operationGroups: { [operation: string]: AgentLatency[] } = {};
    
    // Group by operation
    for (const latency of latencyData) {
      if (!operationGroups[latency.operation]) {
        operationGroups[latency.operation] = [];
      }
      operationGroups[latency.operation].push(latency);
    }

    const metrics: { [operation: string]: any } = {};

    for (const [operation, latencies] of Object.entries(operationGroups)) {
      const durations = latencies.map(l => l.duration).sort((a, b) => a - b);
      const successCount = latencies.filter(l => l.success).length;

      metrics[operation] = {
        averageLatency: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p95Latency: this.calculatePercentile(durations, 95),
        p99Latency: this.calculatePercentile(durations, 99),
        successRate: successCount / latencies.length,
        totalOperations: latencies.length
      };
    }

    return metrics;
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private checkThresholdViolation(latency: AgentLatency): void {
    if (latency.duration > this.thresholds.maxP99Latency) {
      console.warn(`Performance alert: ${latency.agentId} ${latency.operation} took ${latency.duration}ms (threshold: ${this.thresholds.maxP99Latency}ms)`);
    }

    if (!latency.success) {
      console.error(`Performance alert: ${latency.agentId} ${latency.operation} failed: ${latency.errorMessage}`);
    }
  }

  private generatePerformanceRecommendations(agentMetrics: any, operationMetrics: any): string[] {
    const recommendations: string[] = [];

    // Agent-specific recommendations
    for (const [agentId, metrics] of Object.entries(agentMetrics)) {
      if (metrics.averageLatency > this.thresholds.maxAverageLatency) {
        recommendations.push(`Consider optimizing ${agentId} agent - average latency is ${Math.round(metrics.averageLatency)}ms`);
      }

      if (metrics.successRate < this.thresholds.minSuccessRate) {
        recommendations.push(`Investigate ${agentId} agent reliability - success rate is ${Math.round(metrics.successRate * 100)}%`);
      }

      if (metrics.errors.length > 0) {
        const commonErrors = this.getMostCommonErrors(metrics.errors, 3);
        recommendations.push(`Address common errors in ${agentId}: ${commonErrors.join(', ')}`);
      }
    }

    // Operation-specific recommendations
    for (const [operation, metrics] of Object.entries(operationMetrics)) {
      if (metrics.averageLatency > this.thresholds.maxAverageLatency) {
        recommendations.push(`Optimize ${operation} operation - average latency is ${Math.round(metrics.averageLatency)}ms`);
      }
    }

    // General recommendations
    if (Object.keys(agentMetrics).length === 0) {
      recommendations.push('No agent performance data available - ensure agents are being monitored');
    }

    return recommendations;
  }

  private getMostCommonErrors(errors: string[], limit: number): string[] {
    const errorCounts: { [error: string]: number } = {};
    
    for (const error of errors) {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    }

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([error]) => error);
  }
}
