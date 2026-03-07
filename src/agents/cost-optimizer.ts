// Cost optimizer for agent operations
export interface CachedResponse {
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
  agentId: string;
  operation: string;
}

export interface AgentRequest {
  agentId: string;
  operation: string;
  parameters: any;
  priority: 'high' | 'medium' | 'low';
}

export interface OptimizedRequests {
  requests: AgentRequest[];
  batched: boolean;
  estimatedCost: number;
  cacheHits: number;
}

export interface AgentUsage {
  agentId: string;
  operation: string;
  duration: number;
  tokensUsed?: number;
  cost: number;
  timestamp: Date;
}

export interface CostReport {
  totalCost: number;
  agentBreakdown: { [agentId: string]: number };
  operationBreakdown: { [operation: string]: number };
  recommendations: string[];
  period: {
    start: Date;
    end: Date;
  };
}

export interface Optimization {
  type: 'cache' | 'batch' | 'rate_limit' | 'model_selection';
  description: string;
  potentialSavings: number;
  implementation: string;
}

export class AgentCostOptimizer {
  private cache: Map<string, CachedResponse> = new Map();
  private usageLog: AgentUsage[] = [];
  private maxCacheSize: number = 1000;
  private defaultTTL: number = 300000; // 5 minutes

  cacheAgentResponses(key: string, response: any, agentId: string, operation: string, ttl?: number): void {
    const cacheKey = `${agentId}:${operation}:${this.hashKey(key)}`;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      agentId,
      operation
    });
  }

  getCachedResponse(key: string, agentId: string, operation: string): any | null {
    const cacheKey = `${agentId}:${operation}:${this.hashKey(key || '')}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  optimizeApiCalls(requests: AgentRequest[]): OptimizedRequests {
    const optimized: AgentRequest[] = [];
    let cacheHits = 0;
    let estimatedCost = 0;

    for (const request of requests) {
      const cacheKey = JSON.stringify(request.parameters);
      const cached = this.getCachedResponse(cacheKey, request.agentId, request.operation);
      
      if (cached) {
        cacheHits++;
        // Use cached response, no API call needed
        continue;
      }
      
      optimized.push(request);
      
      // Estimate cost (simplified)
      estimatedCost += this.estimateOperationCost(request);
    }

    return {
      requests: optimized,
      batched: this.canBatchRequests(optimized),
      estimatedCost,
      cacheHits
    };
  }

  trackAgentCosts(usage: AgentUsage): void {
    this.usageLog.push(usage);
    
    // Keep only last 1000 entries
    if (this.usageLog.length > 1000) {
      this.usageLog = this.usageLog.slice(-1000);
    }
  }

  generateCostReport(period?: { start: Date; end: Date }): CostReport {
    const now = new Date();
    const defaultPeriod = {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: now
    };
    
    const reportPeriod = period || defaultPeriod;
    
    const filteredUsage = this.usageLog.filter(
      usage => usage.timestamp >= reportPeriod.start && usage.timestamp <= reportPeriod.end
    );

    const agentBreakdown: { [agentId: string]: number } = {};
    const operationBreakdown: { [operation: string]: number } = {};
    let totalCost = 0;

    for (const usage of filteredUsage) {
      agentBreakdown[usage.agentId] = (agentBreakdown[usage.agentId] || 0) + usage.cost;
      operationBreakdown[usage.operation] = (operationBreakdown[usage.operation] || 0) + usage.cost;
      totalCost += usage.cost;
    }

    const recommendations = this.generateCostRecommendations(filteredUsage);

    return {
      totalCost,
      agentBreakdown,
      operationBreakdown,
      recommendations,
      period: reportPeriod
    };
  }

  suggestCostOptimizations(artifacts: any): Optimization[] {
    const optimizations: Optimization[] = [];

    // Cache optimization
    const cachePotential = this.calculateCachePotential();
    if (cachePotential > 0.1) { // 10% potential savings
      optimizations.push({
        type: 'cache',
        description: `Enable response caching for ${Math.round(cachePotential * 100)}% of operations`,
        potentialSavings: cachePotential,
        implementation: 'Configure AgentCostOptimizer with appropriate TTL settings'
      });
    }

    // Batch optimization
    const batchPotential = this.calculateBatchPotential();
    if (batchPotential > 0.05) { // 5% potential savings
      optimizations.push({
        type: 'batch',
        description: `Batch operations for ${Math.round(batchPotential * 100)}% of requests`,
        potentialSavings: batchPotential,
        implementation: 'Group similar operations into single API calls'
      });
    }

    // Model selection optimization
    optimizations.push({
      type: 'model_selection',
      description: 'Use cost-effective AI models for non-critical operations',
      potentialSavings: 0.3, // 30% potential savings
      implementation: 'Implement model selection logic based on operation criticality'
    });

    return optimizations;
  }

  private hashKey(key: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private canBatchRequests(requests: AgentRequest[]): boolean {
    // Simple heuristic: if we have multiple requests to the same agent, we can batch
    const agentCounts: { [agentId: string]: number } = {};
    for (const request of requests) {
      agentCounts[request.agentId] = (agentCounts[request.agentId] || 0) + 1;
    }
    
    return Object.values(agentCounts).some(count => count > 1);
  }

  private estimateOperationCost(request: AgentRequest): number {
    // Simplified cost estimation
    const baseCost = 0.001; // $0.001 per operation
    const priorityMultiplier = request.priority === 'high' ? 2 : 1;
    return baseCost * priorityMultiplier;
  }

  private calculateCachePotential(): number {
    // Calculate potential cache hit rate based on usage patterns
    const recentUsage = this.usageLog.slice(-100); // Last 100 operations
    if (recentUsage.length < 10) return 0;

    const operationCounts: { [key: string]: number } = {};
    for (const usage of recentUsage) {
      const key = `${usage.agentId}:${usage.operation}`;
      operationCounts[key] = (operationCounts[key] || 0) + 1;
    }

    const duplicates = Object.values(operationCounts).filter(count => count > 1);
    const duplicateOperations = duplicates.reduce((sum, count) => sum + (count - 1), 0);
    
    return duplicateOperations / recentUsage.length;
  }

  private calculateBatchPotential(): number {
    // Calculate potential for batching operations
    const recentUsage = this.usageLog.slice(-50); // Last 50 operations
    if (recentUsage.length < 5) return 0;

    const agentCounts: { [agentId: string]: number } = {};
    for (const usage of recentUsage) {
      agentCounts[usage.agentId] = (agentCounts[usage.agentId] || 0) + 1;
    }

    const batchableOperations = Object.values(agentCounts).filter(count => count > 1);
    const totalBatchable = batchableOperations.reduce((sum, count) => sum + (count - 1), 0);
    
    return totalBatchable / recentUsage.length;
  }

  private generateCostRecommendations(usage: AgentUsage[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze usage patterns
    const avgCostPerOperation = usage.reduce((sum, u) => sum + u.cost, 0) / usage.length;
    
    if (avgCostPerOperation > 0.01) { // More than 1 cent per operation
      recommendations.push('Consider using more cost-effective AI models for non-critical operations');
    }
    
    // Check for expensive agents
    const agentCosts: { [agentId: string]: number } = {};
    for (const u of usage) {
      agentCosts[u.agentId] = (agentCosts[u.agentId] || 0) + u.cost;
    }
    
    const mostExpensiveAgent = Object.entries(agentCosts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostExpensiveAgent[1] > 0.5) { // More than 50 cents
      recommendations.push(`Agent ${mostExpensiveAgent[0]} accounts for ${Math.round(mostExpensiveAgent[1] * 100 / usage.reduce((sum, u) => sum + u.cost, 0))}% of costs - consider optimization`);
    }
    
    return recommendations;
  }
}
