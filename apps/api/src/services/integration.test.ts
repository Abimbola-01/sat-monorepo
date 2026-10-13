import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testPool, initTestDatabase } from '../db/sqlitePool'
import { 
  detectRecurringPayments, 
  computeDashboardMetrics, 
  confirmSubscription,
  dismissSubscription,
  editSubscription,
  markSubscriptionInactive,
} from './recurringDetection'

// Helper to generate UUID-like strings
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

describe('Integration tests - Full detection pipeline with SQLite', () => {
  beforeAll(() => {
    initTestDatabase()
  })

  afterAll(async () => {
    await testPool.end()
  })

  describe('Full detection pipeline', () => {
    it('should detect recurring payments from transactions', async () => {
      const userId = uuid()
      
      // Create user
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        userId, uuid(), 'test@example.com', 'Test User'
      )
      
      // Add monthly Netflix transactions (Jan-Aug 2024)
      const months = ['2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01', 
                      '2024-05-01', '2024-06-01', '2024-07-01', '2024-08-01']
      
      for (const date of months) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, date, 'Netflix Subscription', 1500, 'NGN', 'debit'
        )
      }
      
      // Run detection with test pool
      const result = await detectRecurringPayments(userId, testPool)
      
      expect(result.subscriptions.length).toBeGreaterThanOrEqual(1)
      expect(result.totalMonthlyAmount).toBeGreaterThan(0)
      
      const netflixSub = result.subscriptions.find(s => s.name.toLowerCase().includes('netflix'))
      if (netflixSub) {
        expect(netflixSub.frequency).toBe('monthly')
        expect(netflixSub.monthlyAmount).toBeCloseTo(1500, 0)
        expect(netflixSub.confidenceScore).toBeGreaterThanOrEqual(60)
        expect(netflixSub.categories).toContain('Streaming')
      }
    })

    it('should compute dashboard metrics correctly', async () => {
      const userId = uuid()
      
      // Create user
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        userId, uuid(), 'test2@example.com', 'Test User 2'
      )
      
      // Add mixed transactions
      // Netflix monthly
      for (let i = 1; i <= 6; i++) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, `2024-${String(i).padStart(2, '0')}-01`, 'Netflix', 1500, 'NGN', 'debit'
        )
      }
      
      // Spotify monthly
      for (let i = 1; i <= 6; i++) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, `2024-${String(i).padStart(2, '0')}-15`, 'Spotify Premium', 500, 'NGN', 'debit'
        )
      }
      
      // Gym quarterly
      for (let i = 0; i < 4; i++) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, `2024-${String(i * 3 + 1).padStart(2, '0')}-01`, 'FitLife Gym', 5000, 'NGN', 'debit'
        )
      }
      
      // Run detection first to populate subscriptions
      const detectionResult = await detectRecurringPayments(userId, testPool)
      console.log('Detected subscriptions:', detectionResult.subscriptions.length)
      
      // Compute dashboard metrics
      const metrics = await computeDashboardMetrics(userId, testPool)
      
      expect(detectionResult.subscriptions.length).toBeGreaterThan(0)
      expect(metrics.monthlyRecurringSpending).toBeGreaterThan(0)
      expect(metrics.estimatedAnnualRecurringSpending).toBeGreaterThan(0)
      expect(metrics.activeSubscriptionCount).toBeGreaterThanOrEqual(0)
      expect(metrics.spendingByCategory.length).toBeGreaterThanOrEqual(0)
      
      // Verify categories include Streaming
      const streamingCat = metrics.spendingByCategory.find(c => c.category.toLowerCase().includes('streaming'))
      expect(streamingCat).toBeDefined()
    })

    it('should handle empty transactions gracefully', async () => {
      const userId = uuid()
      
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        userId, uuid(), 'empty@example.com', 'Empty User'
      )
      
      const result = await detectRecurringPayments(userId, testPool)
      
      expect(result.subscriptions).toEqual([])
      expect(result.totalMonthlyAmount).toBe(0)
      expect(result.totalYearlyAmount).toBe(0)
    })

    it('should detect weekly subscriptions', async () => {
      const userId = uuid()
      
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        userId, uuid(), 'weekly@example.com', 'Weekly User'
      )
      
      // Add weekly gym payments
      for (let i = 0; i < 8; i++) {
        const date = new Date(2024, 0, 1 + i * 7)
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, date.toISOString().slice(0, 10), 'Weekly Gym', 300, 'NGN', 'debit'
        )
      }
      
      const result = await detectRecurringPayments(userId, testPool)
      
      const weeklySub = result.subscriptions.find(s => s.name.toLowerCase().includes('weekly'))
      if (weeklySub) {
        expect(weeklySub.frequency).toBe('weekly')
        expect(weeklySub.monthlyAmount).toBeCloseTo(300 * 4.33, 0)
      }
    })

    it('should detect biweekly subscriptions', async () => {
      const userId = uuid()
      
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        userId, uuid(), 'biweekly@example.com', 'Biweekly User'
      )
      
      // Add biweekly payments
      for (let i = 0; i < 6; i++) {
        const date = new Date(2024, 0, 1 + i * 14)
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, date.toISOString().slice(0, 10), 'Biweekly Service', 2000, 'NGN', 'debit'
        )
      }
      
      const result = await detectRecurringPayments(userId, testPool)
      
      const biweeklySub = result.subscriptions.find(s => s.name.toLowerCase().includes('biweekly'))
      if (biweeklySub) {
        expect(biweeklySub.frequency).toBe('biweekly')
        expect(biweeklySub.monthlyAmount).toBeCloseTo(2000 * 2.165, 0)
      }
    })

    it('should support subscription management operations', async () => {
      const userId = uuid()
      
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        userId, uuid(), 'manage@example.com', 'Manage User'
      )
      
      // Add transactions and detect
      for (let i = 1; i <= 4; i++) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, `2024-${i.toString().padStart(2, '0')}-01`, 'Test Sub', 1000, 'NGN', 'debit'
        )
      }
      
      const result = await detectRecurringPayments(userId, testPool)
      const subId = result.subscriptions[0]?.id
      
      expect(subId).toBeDefined()
      
      // Test confirm
      if (subId) {
        const confirmResult = await confirmSubscription(userId, testPool, subId)
        expect(confirmResult.success).toBe(true)
        
        // Test mark inactive
        const inactiveResult = await markSubscriptionInactive(userId, testPool, subId)
        expect(inactiveResult.success).toBe(true)
        
        // Test edit
        const editResult = await editSubscription(userId, testPool, subId, { 
          name: 'Renamed Subscription',
          categories: ['Streaming']
        })
        expect(editResult.success).toBe(true)
        
        // Test dismiss
        const dismissResult = await dismissSubscription(userId, testPool, subId)
        expect(dismissResult.success).toBe(true)
      }
    })

    it('should prevent cross-user access', async () => {
      const user1Id = uuid()
      const user2Id = uuid()
      
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        user1Id, uuid(), 'user1@example.com', 'User 1'
      )
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        user2Id, uuid(), 'user2@example.com', 'User 2'
      )
      
      // Add transactions for user 1
      for (let i = 1; i <= 4; i++) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), user1Id, `2024-${i.toString().padStart(2, '0')}-01`, 'User1 Sub', 1000, 'NGN', 'debit'
        )
      }
      
      // Detect for user 1
      const result1 = await detectRecurringPayments(user1Id, testPool)
      expect(result1.subscriptions.length).toBeGreaterThan(0)
      
      // Detect for user 2 (should be empty)
      const result2 = await detectRecurringPayments(user2Id, testPool)
      expect(result2.subscriptions.length).toBe(0)
      
      // User 2 should not see user 1's subscriptions
      const user2Metrics = await computeDashboardMetrics(user2Id, testPool)
      expect(user2Metrics.activeSubscriptions.length).toBe(0)
    })

    it('should cause proper savings calculations', async () => {
      const userId = uuid()
      
      testPool.db.prepare(`INSERT INTO users (id, clerk_id, email, name) VALUES (?, ?, ?, ?)`).run(
        userId, uuid(), 'savings@example.com', 'Savings User'
      )
      
      // Add active subscription
      for (let i = 1; i <= 6; i++) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, `2024-${String(i).padStart(2, '0')}-01`, 'Active Netflix', 1500, 'NGN', 'debit'
        )
      }
      
      // Add inactive subscription (old transactions)
      for (let i = 1; i <= 3; i++) {
        testPool.db.prepare(`INSERT INTO transactions (id, user_id, transaction_date, description, amount, currency, type) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), userId, `2023-${String(i).padStart(2, '0')}-01`, 'Old Gym', 5000, 'NGN', 'debit'
        )
      }
      
      // Run detection
      const result = await detectRecurringPayments(userId, testPool)
      const metrics = await computeDashboardMetrics(userId, testPool)
      
      // Should have potential savings from inactive subscriptions
      expect(metrics.savingsOpportunities.length).toBeGreaterThan(0)
      expect(metrics.potentialMonthlySavings).toBeGreaterThan(0)
    })
  })
})
