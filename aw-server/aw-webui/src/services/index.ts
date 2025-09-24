/**
 * Services Barrel Export
 *
 * Bu dosya tüm service modüllerini merkezi bir noktadan export eder.
 * Service layer organization için barrel exports kullanılır.
 */

// Core API Service
export { APIService } from './api';

// Specialized Service Modules
export { ActivityService, activityService } from './modules/activity-service';

// Service Types
export type { EventQueryParams } from './modules/activity-service';

// Import for internal use
import { activityService } from './modules/activity-service';

// Utility functions for service management
export const serviceUtils = {
  /**
   * Service health check
   */
  async checkServiceHealth(): Promise<{
    api: boolean;
    activity: boolean;
    overall: boolean;
  }> {
    try {
      // Check basic API connectivity
      const apiHealthy = true; // TODO: Implement actual health check

      // Check activity service
      const activityHealthy = true; // TODO: Implement actual health check

      return {
        api: apiHealthy,
        activity: activityHealthy,
        overall: apiHealthy && activityHealthy,
      };
    } catch (error) {
      console.error('Service health check failed:', error);
      return {
        api: false,
        activity: false,
        overall: false,
      };
    }
  },

  /**
   * Service cache management
   */
  clearAllCaches(): void {
    activityService.clearCache();
  },

  /**
   * Service statistics
   */
  getServiceStats(): {
    activity: ReturnType<typeof activityService.getCacheStats>;
  } {
    return {
      activity: activityService.getCacheStats(),
    };
  },
};
