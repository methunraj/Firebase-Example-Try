'use client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

const defaultSchema = JSON.stringify(
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'ExtractedData',
    description: 'Schema for data to be extracted from a document.',
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title or heading of the document',
      },
      date: {
        type: ['string', 'null'],
        format: 'date',
        description: 'The main date mentioned in the document (YYYY-MM-DD format if possible)',
      },
      summary: {
        type: 'string',
        description: 'A brief summary of the document content',
      },
      keywords: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'A list of keywords from the document'
      }
    },
    required: ['title', 'summary'],
  },
  null,
  2
);

interface SchemaContextType {
  schemaJson: string;
  setSchemaJson: Dispatch<SetStateAction<string>>;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

export function SchemaProvider({ children }: { children: React.ReactNode }) {
  const [schemaJson, setSchemaJson] = useState<string>(defaultSchema);

  const value = useMemo(() => ({ schemaJson, setSchemaJson }), [schemaJson]);

  return <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>;
}

export function useSchema() {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error('useSchema must be used within a SchemaProvider');
  }
  return context;
}
