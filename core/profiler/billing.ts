/**
 * Cost-Aware Profiler — Cloud Billing Projection
 *
 * Projects estimated cloud cost based on detected anti-patterns.
 * Models: AWS Lambda, DynamoDB, Postgres (RDS), API Gateway.
 */

import type { AntiPattern } from './scanner.js';

export interface BillingEstimate {
  service: string;
  estimatedMonthlyCostUSD: number;
  assumptions: string;
  worstCaseMultiplier: number;
}

export interface BillingProjection {
  estimates: BillingEstimate[];
  totalEstimatedMonthlyCostUSD: number;
  exceedsThreshold: boolean;
  thresholdUSD: number;
}

/** Cost models (simplified) — update constants to match your infra */
const COST_MODELS = {
  lambdaDurationPer100ms: 0.000001667,     // $0.0000167 per GB-second at 1GB
  dynamoDbReadUnit: 0.00000025,            // $0.25 per million RCUs
  dynamoDbWriteUnit: 0.00000125,           // $1.25 per million WCUs
  postgresConnectionCost: 0.0001,          // Rough cost per connection-minute
  apiGatewayCostPerRequest: 0.0000035,     // $3.50 per million requests
};

const MONTHLY_REQUEST_ESTIMATE = 1_000_000; // 1M requests/month baseline

/**
 * Projects billing impact from detected anti-patterns.
 *
 * @param antiPatterns - Detected cost anti-patterns from scanner
 * @param thresholdUSD - Monthly cost threshold that triggers a block (default: $500)
 */
export function projectBillingImpact(
  antiPatterns: AntiPattern[],
  thresholdUSD = 500
): BillingProjection {
  const estimates: BillingEstimate[] = [];

  const nPlusOneCount = antiPatterns.filter((p) => p.type === 'n-plus-one-query').length;

  if (nPlusOneCount > 0) {
    // N+1: each request triggers N extra DB reads. Assume avg N=50.
    const extraReads = MONTHLY_REQUEST_ESTIMATE * 50 * nPlusOneCount;
    estimates.push({
      service: 'DynamoDB/Postgres (N+1 reads)',
      estimatedMonthlyCostUSD: extraReads * COST_MODELS.dynamoDbReadUnit,
      assumptions: `${nPlusOneCount} N+1 pattern(s), avg 50 extra reads/request, ${MONTHLY_REQUEST_ESTIMATE.toLocaleString()} req/month`,
      worstCaseMultiplier: 10,
    });
  }

  const total = estimates.reduce((sum, e) => sum + e.estimatedMonthlyCostUSD, 0);

  return {
    estimates,
    totalEstimatedMonthlyCostUSD: total,
    exceedsThreshold: total > thresholdUSD,
    thresholdUSD,
  };
}
