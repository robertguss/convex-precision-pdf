import { faker } from '@faker-js/faker';

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
  metadata: {
    confidence: number;
    type: string;
    [key: string]: any;
  };
}

export function generateChunk(overrides: Partial<MockChunk> = {}): MockChunk {
  return {
    chunk_id: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    page: faker.number.int({ min: 1, max: 10 }),
    bbox: faker.helpers.maybe(() => ({
      x: faker.number.int({ min: 0, max: 500 }),
      y: faker.number.int({ min: 0, max: 700 }),
      width: faker.number.int({ min: 50, max: 200 }),
      height: faker.number.int({ min: 10, max: 50 }),
    })),
    metadata: {
      confidence: faker.number.float({ min: 0.7, max: 1.0 }),
      type: faker.helpers.arrayElement(['paragraph', 'heading', 'list', 'table', 'caption']),
      extracted_at: faker.date.recent().toISOString(),
      ...overrides.metadata,
    },
    ...overrides,
  };
}

export function generateHeadingChunk(overrides: Partial<MockChunk> = {}): MockChunk {
  return generateChunk({
    content: faker.lorem.words({ min: 2, max: 6 }),
    metadata: {
      confidence: faker.number.float({ min: 0.8, max: 1.0 }),
      type: 'heading',
      level: faker.number.int({ min: 1, max: 6 }),
    },
    ...overrides,
  });
}

export function generateParagraphChunk(overrides: Partial<MockChunk> = {}): MockChunk {
  return generateChunk({
    content: faker.lorem.paragraph(),
    metadata: {
      confidence: faker.number.float({ min: 0.7, max: 0.95 }),
      type: 'paragraph',
    },
    ...overrides,
  });
}

export function generateListChunk(overrides: Partial<MockChunk> = {}): MockChunk {
  const listItems = Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => 
    `• ${faker.lorem.sentence()}`
  );
  
  return generateChunk({
    content: listItems.join('\n'),
    metadata: {
      confidence: faker.number.float({ min: 0.8, max: 0.95 }),
      type: 'list',
      items: listItems.length,
    },
    ...overrides,
  });
}

export function generateTableChunk(overrides: Partial<MockChunk> = {}): MockChunk {
  const headers = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => 
    faker.lorem.word()
  );
  const rows = Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () =>
    headers.map(() => faker.lorem.word()).join(' | ')
  );
  const tableContent = [headers.join(' | '), ...rows].join('\n');
  
  return generateChunk({
    content: tableContent,
    metadata: {
      confidence: faker.number.float({ min: 0.6, max: 0.9 }),
      type: 'table',
      columns: headers.length,
      rows: rows.length,
    },
    ...overrides,
  });
}

export function generateChunksForPage(page: number, count?: number): MockChunk[] {
  const chunkCount = count || faker.number.int({ min: 2, max: 8 });
  return Array.from({ length: chunkCount }, () => generateChunk({ page }));
}

export function generateChunksForDocument(pageCount: number): MockChunk[] {
  const chunks: MockChunk[] = [];
  
  for (let page = 1; page <= pageCount; page++) {
    const pageChunks = generateChunksForPage(page);
    chunks.push(...pageChunks);
  }
  
  return chunks;
}

export function generateMultipleChunks(count: number, overrides: Partial<MockChunk> = {}): MockChunk[] {
  return Array.from({ length: count }, () => generateChunk(overrides));
}

export function generateChunksWithContent(contents: string[], page: number = 1): MockChunk[] {
  return contents.map((content, index) => generateChunk({
    content,
    page,
    chunk_id: `chunk_${page}_${index + 1}`,
  }));
}