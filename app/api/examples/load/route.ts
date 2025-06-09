import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Example ID is required' }, { status: 400 });
  }

  try {
    // Load the JSON file for the example
    const examplePath = path.join(process.cwd(), 'public', 'examples', id, `${id}.json`);
    const jsonContent = await fs.readFile(examplePath, 'utf-8');
    const data = JSON.parse(jsonContent);

    // Transform the data to match the expected document format
    const transformedDocument = {
      _id: id,
      _creationTime: Date.now(),
      userId: 'demo-user',
      title: data.filename || `${id}.pdf`,
      originalFilename: data.filename || `${id}.pdf`,
      storageId: null,
      status: 'completed' as const,
      pageCount: data.num_pages || 0,
      processedAt: Date.now(),
      uploadedAt: Date.now(),
      markdown: data.markdown || '',
      chunks: (data.chunks || []).map((chunk: any) => ({
        chunk_id: chunk.chunk_id,
        content: chunk.content || chunk.text,
        page: chunk.page,
        bbox: chunk.bbox,
        metadata: chunk.metadata || {
          chunk_type: chunk.chunk_type || 'text',
          grounding: chunk.grounding || []
        }
      })),
      errorMessage: null,
      landingAiResponse: {
        isExample: true,
        staticBasePath: `/examples/${id}/images`
      }
    };

    return NextResponse.json(transformedDocument);
  } catch (error) {
    console.error('Failed to load example:', error);
    return NextResponse.json({ error: 'Example not found' }, { status: 404 });
  }
}