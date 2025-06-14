import { faker } from '@faker-js/faker';
import { Id } from '../../../../convex/_generated/dataModel';

export interface MockChunk {
  chunk_id: string;
  content: string;
  page: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: any;
}

export interface MockDocument {
  _id: Id<'documents'>;
  _creationTime: number;
  userId: Id<'users'>;
  title: string;
  fileId?: Id<'_storage'>;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  landingAiResponse?: any;
  markdown?: string;
  chunks?: MockChunk[];
  marginalia?: any[];
  pageImages?: Id<'_storage'>[];
  pageCount?: number;
  fileSize: number;
  mimeType: string;
  createdAt: number;
  updatedAt: number;
}

export function generateDocument(overrides: Partial<MockDocument> = {}): MockDocument {
  const status = overrides.status || faker.helpers.arrayElement(['uploading', 'processing', 'completed', 'failed'] as const);
  const pageCount = faker.number.int({ min: 1, max: 100 });
  const title = faker.lorem.words({ min: 2, max: 6 });
  const createdAt = faker.date.recent({ days: 7 }).getTime();

  return {
    _id: faker.string.uuid() as Id<'documents'>,
    _creationTime: createdAt,
    userId: faker.string.uuid() as Id<'users'>,
    title,
    fileId: faker.helpers.maybe(() => faker.string.uuid() as Id<'_storage'>),
    status,
    errorMessage: status === 'failed' ? faker.lorem.sentence() : undefined,
    landingAiResponse: status === 'completed' ? generateLandingAiResponse() : undefined,
    markdown: status === 'completed' ? faker.lorem.paragraphs(5, '\n\n') : undefined,
    chunks: status === 'completed' ? generateChunks(pageCount) : undefined,
    marginalia: status === 'completed' ? faker.helpers.maybe(() => []) : undefined,
    pageImages: status === 'completed' ? Array.from({ length: pageCount }, () => faker.string.uuid() as Id<'_storage'>) : undefined,
    pageCount,
    fileSize: faker.number.int({ min: 100000, max: 50000000 }),
    mimeType: 'application/pdf',
    createdAt,
    updatedAt: faker.date.between({ from: new Date(createdAt), to: new Date() }).getTime(),
    ...overrides,
  };
}

export function generateUploadingDocument(overrides: Partial<MockDocument> = {}): MockDocument {
  return generateDocument({
    status: 'uploading',
    landingAiResponse: undefined,
    markdown: undefined,
    chunks: undefined,
    marginalia: undefined,
    pageImages: undefined,
    ...overrides,
  });
}

export function generateProcessingDocument(overrides: Partial<MockDocument> = {}): MockDocument {
  return generateDocument({
    status: 'processing',
    landingAiResponse: undefined,
    markdown: undefined,
    chunks: undefined,
    marginalia: undefined,
    pageImages: undefined,
    ...overrides,
  });
}

export function generateCompletedDocument(overrides: Partial<MockDocument> = {}): MockDocument {
  return generateDocument({
    status: 'completed',
    landingAiResponse: generateLandingAiResponse(),
    markdown: faker.lorem.paragraphs(5, '\n\n'),
    ...overrides,
  });
}

export function generateFailedDocument(overrides: Partial<MockDocument> = {}): MockDocument {
  return generateDocument({
    status: 'failed',
    errorMessage: faker.helpers.arrayElement([
      'File format not supported',
      'Document is corrupted',
      'Processing timeout',
      'Landing AI service unavailable',
      'File too large',
    ]),
    landingAiResponse: undefined,
    markdown: undefined,
    chunks: undefined,
    marginalia: undefined,
    pageImages: undefined,
    ...overrides,
  });
}

export function generateDocumentForUser(userId: Id<'users'>, overrides: Partial<MockDocument> = {}): MockDocument {
  return generateDocument({
    userId,
    ...overrides,
  });
}

export function generateMultipleDocuments(count: number, overrides: Partial<MockDocument> = {}): MockDocument[] {
  return Array.from({ length: count }, () => generateDocument(overrides));
}

function generateLandingAiResponse(): any {
  return {
    request_id: faker.string.uuid(),
    status: 'completed',
    result: {
      pages: faker.number.int({ min: 1, max: 100 }),
      text_extraction: {
        confidence: faker.number.float({ min: 0.8, max: 1.0 }),
        method: 'ocr',
      },
    },
    created_at: faker.date.recent().toISOString(),
  };
}

function generateChunks(pageCount: number): MockChunk[] {
  const chunks: MockChunk[] = [];
  const chunksPerPage = faker.number.int({ min: 2, max: 8 });
  
  for (let page = 1; page <= pageCount; page++) {
    for (let i = 0; i < chunksPerPage; i++) {
      chunks.push({
        chunk_id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        page,
        bbox: faker.helpers.maybe(() => ({
          x: faker.number.int({ min: 0, max: 500 }),
          y: faker.number.int({ min: 0, max: 700 }),
          width: faker.number.int({ min: 50, max: 200 }),
          height: faker.number.int({ min: 10, max: 50 }),
        })),
        metadata: {
          confidence: faker.number.float({ min: 0.7, max: 1.0 }),
          type: faker.helpers.arrayElement(['paragraph', 'heading', 'list', 'table']),
        },
      });
    }
  }
  
  return chunks;
}