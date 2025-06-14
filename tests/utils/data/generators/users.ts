import { faker } from '@faker-js/faker';
import { Id } from '../../../../convex/_generated/dataModel';

export interface MockUser {
  _id: Id<'users'>;
  _creationTime: number;
  name: string;
  email: string;
  externalId: string;
}

export function generateUser(overrides: Partial<MockUser> = {}): MockUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
  });

  return {
    _id: faker.string.uuid() as Id<'users'>,
    _creationTime: faker.date.recent({ days: 30 }).getTime(),
    name: `${firstName} ${lastName}`,
    email,
    externalId: `user_${faker.string.alphanumeric(24)}`,
    ...overrides,
  };
}

export function generateUserWithClerkId(clerkId: string, overrides: Partial<MockUser> = {}): MockUser {
  return generateUser({
    externalId: clerkId,
    ...overrides,
  });
}

export function generateMultipleUsers(count: number, overrides: Partial<MockUser> = {}): MockUser[] {
  return Array.from({ length: count }, () => generateUser(overrides));
}