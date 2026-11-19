import { describe, it, expect } from 'vitest';
import { calculateGoals, exampleProfile, projectionWeeks, portionMacros } from '@/lib/nutrition';
describe('MassaFit nutrition rules', () => {
  it('calculates male Mifflin-St Jeor for 47 years, 177 cm and 69 kg', () => { expect(calculateGoals(exampleProfile).bmr).toBe(1566); });
  it('calculates female Mifflin-St Jeor', () => { expect(calculateGoals({...exampleProfile,sex:'female'}).bmr).toBe(1400); });
  it('adds the default 350 kcal to activity expenditure', () => { expect(calculateGoals(exampleProfile).calories).toBe(2778); });
  it('limits surplus to 250 kcal minimum', () => { expect(calculateGoals(exampleProfile,100).surplus).toBe(250); });
  it('limits surplus to 500 kcal maximum', () => { expect(calculateGoals(exampleProfile,600).surplus).toBe(500); });
  it('uses 2 g protein per kilogram', () => { expect(calculateGoals(exampleProfile).protein).toBe(138); });
  it('uses 0.95 g fat per kilogram', () => { expect(calculateGoals(exampleProfile).fat).toBe(66); });
  it('allocates remaining calories to carbohydrates', () => { expect(calculateGoals(exampleProfile).carbs).toBe(408); });
  it('projects weight gain at 0.25–0.35 kg per week', () => { expect(projectionWeeks(69,75)).toEqual({fastest:18,slowest:24}); });
  it('calculates food macros for grams', () => { expect(portionMacros({calories:159,protein:32,fat:2.5,carbs:0},150)).toEqual({calories:239,protein:48,fat:3.8,carbs:0}); });
});