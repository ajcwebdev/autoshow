// scripts/document-schema.ts

import { join } from 'path'
import { writeFileSync } from 'fs'
import { readFileSync } from 'fs'

const documentCurrentSchema = async (): Promise<void> => {
  console.log('[document-schema] Starting schema documentation...')
  
  try {
    const schemaPath = join(process.cwd(), 'src', 'prisma', 'schema.prisma')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    console.log('[document-schema] Analyzing Prisma schema...')
    
    const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g
    const models: Record<string, any> = {}
    let match
    
    while ((match = modelRegex.exec(schema)) !== null) {
      const modelName = match[1]
      const modelContent = match[2]
      
      console.log(`[document-schema] Processing model: ${modelName}`)
      
      const fields = extractFields(modelContent)
      models[modelName] = fields
    }
    
    const documentation = {
      prismaSchema: schema,
      modelsAnalysis: models,
      queries: documentQueries(),
      createdAt: new Date().toISOString()
    }
    
    const outputPath = join(process.cwd(), 'migration-docs', 'prisma-schema-doc.json')
    writeFileSync(outputPath, JSON.stringify(documentation, null, 2))
    console.log(`[document-schema] Documentation saved to: ${outputPath}`)
    
  } catch (error) {
    console.error('[document-schema] Error documenting schema:', error)
    throw error
  }
}

const extractFields = (modelContent: string): Record<string, any> => {
  const fieldRegex = /(\w+)\s+(\w+)(?:\[])?\s*(@[^\n]*)?/g
  const fields: Record<string, any> = {}
  let fieldMatch
  
  while ((fieldMatch = fieldRegex.exec(modelContent)) !== null) {
    const fieldName = fieldMatch[1]
    const fieldType = fieldMatch[2]
    const attributes = fieldMatch[3] || ''
    
    fields[fieldName] = {
      type: fieldType,
      attributes: attributes.trim()
    }
  }
  
  return fields
}

const documentQueries = (): string[] => {
  console.log('[document-schema] Documenting database queries...')
  
  const queryList = [
    'SELECT * FROM show_notes',
    'SELECT * FROM embeddings', 
    'INSERT INTO show_notes',
    'UPDATE show_notes',
    'DELETE FROM show_notes',
    'SELECT COUNT(*) FROM show_notes'
  ]
  
  return queryList
}

export default documentCurrentSchema