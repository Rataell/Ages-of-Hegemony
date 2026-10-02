import { NonNegativeIntegerSchema, RESOURCE_KEYS, ResourcePoolSchema, ResourceTypeSchema, type ResourcePool, type ResourceType, type GameRuleError, type PlayerState } from '@aoh/game-domain';
import { err, ok, type Result } from '@aoh/shared';

const resourceKeys: Record<ResourceType, keyof ResourcePool> = { FOOD: 'food', MATERIALS: 'materials', WEALTH: 'wealth', KNOWLEDGE: 'knowledge', INFLUENCE: 'influence' };
export function canAfford(pool: ResourcePool, cost: ResourcePool): boolean {
  if (!ResourcePoolSchema.safeParse(pool).success || !ResourcePoolSchema.safeParse(cost).success) return false;
  return Object.values(resourceKeys).every((key) => pool[key] >= cost[key]);
}

/** Owns payment for shared core rules. The slice uses this default; Alpha supplies its seven-resource authority. */
export type ResourcePayment = (player: PlayerState, cost: ResourcePool) => boolean;
export const payLegacyResources: ResourcePayment = (player, cost) => {
  if (!canAfford(player.resources, cost)) return false;
  for (const key of RESOURCE_KEYS) player.resources[key] -= cost[key];
  return true;
};
function changeResource(pool: ResourcePool, resource: ResourceType, amount: number, spend: boolean): Result<ResourcePool, GameRuleError> {
  if (!ResourcePoolSchema.safeParse(pool).success || !ResourceTypeSchema.safeParse(resource).success || !NonNegativeIntegerSchema.safeParse(amount).success) return err({ code: 'INVALID_RESOURCE', message: 'Resources require non-negative safe integers and a known type' });
  const key = resourceKeys[resource];
  const value = pool[key] + (spend ? -amount : amount);
  if (value < 0) return err({ code: 'INSUFFICIENT_RESOURCES', message: `Insufficient ${resource}` });
  if (!Number.isSafeInteger(value)) return err({ code: 'INVALID_RESOURCE', message: 'Resource overflow' });
  return ok({ ...pool, [key]: value });
}
export const addResource = (pool: ResourcePool, resource: ResourceType, amount: number): Result<ResourcePool, GameRuleError> => changeResource(pool, resource, amount, false);
export const spendResource = (pool: ResourcePool, resource: ResourceType, amount: number): Result<ResourcePool, GameRuleError> => changeResource(pool, resource, amount, true);
