// src/routes/api/show-notes/index.ts

/**
 * Handler for retrieving all show notes from the database.
 * Returns a JSON object containing all show notes.
 *
 * @param event - APIEvent object for the incoming request
 * @returns A Promise that resolves to a Response
 */

'use server'

import type { APIEvent } from '@solidjs/start/server';
import { db } from '../../../db/index';
import { showNotes } from '../../../db/schema';
import { desc } from 'drizzle-orm';

export async function GET(_event: APIEvent): Promise<Response> {
  try {
    // Drizzle example: select all notes, sort by publishDate DESC
    const results = db.select().from(showNotes).orderBy(desc(showNotes.publishDate)).all();

    return new Response(JSON.stringify({ showNotes: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching show notes:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while fetching show notes' }), { status: 500 });
  }
}