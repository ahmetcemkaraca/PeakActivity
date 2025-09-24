import * as functions from 'firebase-functions';

interface ActivityEvent {
  app: string;
  title: string;
  url: string | null;
}

interface CommunityRule {
  pattern: string;
  category: string;
  popularity?: number; // Added for sorting, optional
}

interface CommunityRuleMatchOutput {
  matched_rule: CommunityRule | null;
  category: string | null;
  source: string;
}

export class CommunityRulesService {
  /**
   * Converts a glob pattern to a regex.
   * @param globPattern The glob pattern to convert.
   * @returns The regex pattern.
   */
  private globToRegex(globPattern: string): RegExp {
    const escaped = globPattern.replace(/[.+^${}()|\[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regex}$`, 'i');
  }

  /**
   * Matches an event against community rules.
   * @param event The event to match.
   * @param communityRules The array of community rules to use. Assumed to be sorted by popularity.
   * @returns Output containing the matched rule and category information.
   */
  public matchCommunityRule(
    event: ActivityEvent,
    communityRules: CommunityRule[]
  ): CommunityRuleMatchOutput {
    // 1. Iterate `community_rules` in order of popularity. (Assuming input is already sorted)
    for (const rule of communityRules) {
      const regex = this.globToRegex(rule.pattern);

      // Check for app, title, or url match
      if (event.app && regex.test(event.app)) {
        return {
          matched_rule: rule,
          category: rule.category,
          source: 'community',
        };
      }

      if (event.title && regex.test(event.title)) {
        return {
          matched_rule: rule,
          category: rule.category,
          source: 'community',
        };
      }

      if (event.url && regex.test(event.url)) {
        return {
          matched_rule: rule,
          category: rule.category,
          source: 'community',
        };
      }
    }

    // 3. If no match, return null for matched_rule & category.
    return {
      matched_rule: null,
      category: null,
      source: 'none',
    };
  }
}
