/**
 * Custom Handler Registry
 *
 * Registry để quản lý và lookup custom handlers.
 */

import type {
  ImmediateHandler,
  CombatHandler,
  HandlerMetadata,
  ImmediateHandlerContext,
  CombatHandlerContext,
  ImmediateHandlerResult,
  CombatHandlerResult,
} from './types';

// ============================================================================
// HANDLER REGISTRY
// ============================================================================

class HandlerRegistryClass {
  private immediateHandlers: Map<string, ImmediateHandler> = new Map();
  private combatHandlers: Map<string, CombatHandler> = new Map();
  private metadata: Map<string, HandlerMetadata> = new Map();

  /**
   * Register an immediate handler
   */
  registerImmediate(name: string, handler: ImmediateHandler, description?: string): void {
    this.immediateHandlers.set(name, handler);
    this.metadata.set(name, {
      name,
      description,
      type: 'immediate',
      handler,
    });
  }

  /**
   * Register a combat handler
   */
  registerCombat(name: string, handler: CombatHandler, description?: string): void {
    this.combatHandlers.set(name, handler);
    this.metadata.set(name, {
      name,
      description,
      type: 'combat',
      handler,
    });
  }

  /**
   * Register a handler that works in both contexts
   */
  registerBoth(
    name: string,
    immediateHandler: ImmediateHandler,
    combatHandler: CombatHandler,
    description?: string
  ): void {
    this.immediateHandlers.set(name, immediateHandler);
    this.combatHandlers.set(name, combatHandler);
    this.metadata.set(name, {
      name,
      description,
      type: 'both',
      handler: immediateHandler, // Store immediate as primary
    });
  }

  /**
   * Get immediate handler by name
   */
  getImmediate(name: string): ImmediateHandler | undefined {
    return this.immediateHandlers.get(name);
  }

  /**
   * Get combat handler by name
   */
  getCombat(name: string): CombatHandler | undefined {
    return this.combatHandlers.get(name);
  }

  /**
   * Check if handler exists
   */
  has(name: string): boolean {
    return this.immediateHandlers.has(name) || this.combatHandlers.has(name);
  }

  /**
   * Check if immediate handler exists
   */
  hasImmediate(name: string): boolean {
    return this.immediateHandlers.has(name);
  }

  /**
   * Check if combat handler exists
   */
  hasCombat(name: string): boolean {
    return this.combatHandlers.has(name);
  }

  /**
   * Execute immediate handler
   */
  executeImmediate(
    name: string,
    context: ImmediateHandlerContext
  ): ImmediateHandlerResult | null {
    const handler = this.immediateHandlers.get(name);
    if (!handler) {
      // console.warn(`Immediate handler not found: ${name}`);
      return null;
    }
    try {
      return handler(context);
    } catch (error) {
      console.error(`Error executing immediate handler ${name}:`, error);
      return null;
    }
  }

  /**
   * Execute combat handler
   */
  executeCombat(
    name: string,
    context: CombatHandlerContext
  ): CombatHandlerResult | null {
    const handler = this.combatHandlers.get(name);
    if (!handler) {
      // console.warn(`Combat handler not found: ${name}`);
      return null;
    }
    try {
      return handler(context);
    } catch (error) {
      console.error(`Error executing combat handler ${name}:`, error);
      return null;
    }
  }

  /**
   * Get all registered handler names
   */
  getAllNames(): string[] {
    const names = new Set<string>();
    this.immediateHandlers.forEach((_, name) => names.add(name));
    this.combatHandlers.forEach((_, name) => names.add(name));
    return Array.from(names);
  }

  /**
   * Get handler metadata
   */
  getMetadata(name: string): HandlerMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.immediateHandlers.clear();
    this.combatHandlers.clear();
    this.metadata.clear();
  }

  /**
   * Get count of registered handlers
   */
  get count(): { immediate: number; combat: number; total: number } {
    return {
      immediate: this.immediateHandlers.size,
      combat: this.combatHandlers.size,
      total: this.metadata.size,
    };
  }
}

// Singleton instance
export const HandlerRegistry = new HandlerRegistryClass();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to register immediate handler
 */
export function registerImmediateHandler(
  name: string,
  handler: ImmediateHandler,
  description?: string
): void {
  HandlerRegistry.registerImmediate(name, handler, description);
}

/**
 * Helper to register combat handler
 */
export function registerCombatHandler(
  name: string,
  handler: CombatHandler,
  description?: string
): void {
  HandlerRegistry.registerCombat(name, handler, description);
}
