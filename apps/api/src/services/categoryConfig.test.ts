import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CATEGORY_RULES,
  inferCategories,
  getPrimaryCategory,
  getCategoriesByGroup,
  getCategoryNames,
  categoryToName,
  CategoryRule,
} from './categoryConfig'

describe('Category Configuration', () => {
  describe('Default categories', () => {
    it('has streaming category', () => {
      const streaming = DEFAULT_CATEGORY_RULES.find((r) => r.id === 'streaming')
      expect(streaming).toBeDefined()
      expect(streaming?.name).toBe('Streaming')
      expect(streaming?.group).toBe('Entertainment')
    })

    it('has software category', () => {
      const software = DEFAULT_CATEGORY_RULES.find((r) => r.id === 'software')
      expect(software).toBeDefined()
      expect(software?.name).toBe('Software')
      expect(software?.group).toBe('Technology')
    })

    it('has categories organized by group', () => {
      const groups = getCategoriesByGroup()
      expect(groups['Entertainment']).toBeDefined()
      expect(groups['Technology']).toBeDefined()
      expect(groups['Money']).toBeDefined()
      expect(groups['Bills']).toBeDefined()
      expect(groups['Wellness']).toBeDefined()
    })

    it('returns all category names', () => {
      const names = getCategoryNames()
      expect(names).toContain('Streaming')
      expect(names).toContain('Software')
      expect(names).toContain('Finance')
      expect(names).toContain('Utilities')
    })
  })

  describe('Category inference', () => {
    it('identifies Netflix as Streaming', () => {
      const cats = inferCategories('Netflix', 'netflix subscription')
      expect(cats.map((c) => c.name)).toContain('Streaming')
    })

    it('identifies Spotify as Streaming', () => {
      const cats = inferCategories('Spotify', 'spotify premium')
      expect(cats.map((c) => c.name)).toContain('Streaming')
    })

    it('identifies AWS as Software', () => {
      const cats = inferCategories('AWS', 'aws cloud hosting')
      expect(cats.map((c) => c.name)).toContain('Software')
    })

    it('identifies Electricity as Utilities', () => {
      const cats = inferCategories('Electricity Company', 'electricity bill')
      expect(cats.map((c) => c.name)).toContain('Utilities')
    })

    it('identifies multiple categories for one merchant', () => {
      // A healthcare app subscription could be both Health and Software
      const cats = inferCategories('MyFitnessPal', 'fitness app subscription')
      expect(cats.length).toBeGreaterThanOrEqual(1)
    })

    it('returns empty array for unknown merchant', () => {
      const cats = inferCategories('Unknown Shop', 'random purchase')
      expect(cats).toEqual([])
    })

    it('gets primary category', () => {
      const primary = getPrimaryCategory('Netflix', 'netflix subscription')
      expect(primary).toBeDefined()
      expect(primary?.name).toBe('Streaming')
    })

    it('returns null for unknown merchant primary category', () => {
      const primary = getPrimaryCategory('Unknown Shop', 'random purchase')
      expect(primary).toBeNull()
    })
  })

  describe('Extensibility', () => {
    it('allows custom category rules', () => {
      const customRules: CategoryRule[] = [
        ...DEFAULT_CATEGORY_RULES,
        {
          id: 'pets',
          name: 'Pets',
          group: 'Lifestyle',
          priority: 5,
          patterns: [/\b(pet\s*food|dog\s*food|cat\s*food|pet\s*store)\b/i],
        },
      ]

      const cats = inferCategories('Petco', 'pet food supplies', customRules)
      expect(cats.map((c) => c.name)).toContain('Pets')
    })

    it('allows adding new categories without modifying existing ones', () => {
      // Create custom rules with a completely new category
      const customRules: CategoryRule[] = [
        ...DEFAULT_CATEGORY_RULES,
        {
          id: 'charity',
          name: 'Charity & Donations',
          group: 'Giving',
          priority: 5,
          patterns: [/\b(red\s*cross|unicef|unicef|world\s*svision|donation|charity)\b/i],
        },
      ]

      const cats = inferCategories('Red Cross', 'monthly donation', customRules)
      expect(cats.map((c) => c.name)).toContain('Charity & Donations')
    })

    it('categoryToName converts rule to string', () => {
      const rule: CategoryRule = {
        id: 'test',
        name: 'Test Category',
        group: 'Test',
        priority: 5,
        patterns: [],
      }
      expect(categoryToName(rule)).toBe('Test Category')
    })

    it('maintains backward compatibility with existing categories', () => {
      // Even with custom rules, existing categories should still work
      const customRules: CategoryRule[] = [
        ...DEFAULT_CATEGORY_RULES,
        {
          id: 'custom',
          name: 'Custom Category',
          group: 'Custom',
          priority: 1,
          patterns: [/\b(custom)\b/i],
        },
      ]

      // Existing categories should still match
      expect(
        inferCategories('Netflix', 'netflix subscription', customRules).map((c) => c.name)
      ).toContain('Streaming')
      
      expect(
        inferCategories('AWS', 'aws cloud', customRules).map((c) => c.name)
      ).toContain('Software')
    })
  })

  describe('Category groups', () => {
    it('organizes categories into logical groups', () => {
      const groups = getCategoriesByGroup()
      
      expect(groups['Entertainment']).toContainEqual(
        expect.objectContaining({ name: 'Streaming' })
      )
      expect(groups['Technology']).toContainEqual(
        expect.objectContaining({ name: 'Software' })
      )
      expect(groups['Money']).toContainEqual(
        expect.objectContaining({ name: 'Finance' })
      )
    })

    it('includes all predefined groups', () => {
      const groups = getCategoriesByGroup()
      expect(Object.keys(groups)).toContain('Entertainment')
      expect(Object.keys(groups)).toContain('Technology')
      expect(Object.keys(groups)).toContain('Money')
      expect(Object.keys(groups)).toContain('Bills')
      expect(Object.keys(groups)).toContain('Wellness')
      expect(Object.keys(groups)).toContain('Learning')
      expect(Object.keys(groups)).toContain('Media')
      expect(Object.keys(groups)).toContain('Retail')
      expect(Object.keys(groups)).toContain('Transportation')
      expect(Object.keys(groups)).toContain('Protection')
    })
  })

  describe('Pattern matching', () => {
    it('matches Netflix with various formats', () => {
      expect(
        inferCategories('Netflix', '').map((c) => c.name)
      ).toContain('Streaming')
      
      expect(
        inferCategories('NETFLIX', '').map((c) => c.name)
      ).toContain('Streaming')
      
      expect(
        inferCategories('Netflix Subscription', 'monthly payment').map((c) => c.name)
      ).toContain('Streaming')
    })

    it('matches utilities with various providers', () => {
      expect(
        inferCategories('IKEDC', 'electricity bill').map((c) => c.name)
      ).toContain('Utilities')
      
      expect(
        inferCategories('MTN', 'mobile airtime').map((c) => c.name)
      ).toContain('Utilities')
    })

    it('matches multiple patterns within same category', () => {
      // Streaming category has multiple patterns
      expect(
        inferCategories('Hulu', '').map((c) => c.name)
      ).toContain('Streaming')
      
      expect(
        inferCategories('Disney+', '').map((c) => c.name)
      ).toContain('Streaming')
    })
  })
})
