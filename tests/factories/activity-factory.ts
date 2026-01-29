import { faker } from '@faker-js/faker';
import type { ActivityEvent } from '@/types/activity';

export class ActivityFactory {
  static createEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
    return {
      id: faker.string.uuid(),
      timestamp: faker.date.recent().toISOString(),
      duration: faker.number.int({ min: 60, max: 7200 }),
      data: {
        app: faker.helpers.arrayElement(['code.exe', 'chrome.exe', 'slack.exe', 'photoshop.exe']),
        title: faker.lorem.sentence(),
        url: faker.internet.url(),
        category: faker.helpers.arrayElement(['development', 'design', 'communication'])
      },
      ...overrides
    };
  }

  static createMultipleEvents(count: number = 10): ActivityEvent[] {
    return Array.from({ length: count }, () => this.createEvent());
  }

  static createEventWithCategory(category: string): ActivityEvent {
    return {
      ...this.createEvent(),
      data: {
        ...this.createEvent().data,
        category
      }
    };
  }
}
