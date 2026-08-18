import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });

const schemaNames = ['envelope', 'report', 'feature', 'bug', 'idea', 'plan'] as const;

type SchemaName = (typeof schemaNames)[number];

const validators = new Map<SchemaName, ValidateFunction>();

async function loadSchema(schemaName: SchemaName): Promise<object> {
  const schemaPath = path.resolve(process.cwd(), `schemas/${schemaName}.schema.json`);
  return JSON.parse(await readFile(schemaPath, 'utf8')) as object;
}

function formatAjvError(error: ErrorObject): string {
  const pointer = error.instancePath || '/';
  const expected = error.message ?? 'schema mismatch';
  return `${pointer}: ${expected}`;
}

function hintForError(error: ErrorObject): string {
  switch (error.keyword) {
    case 'required':
      return 'hint: add the missing required field';
    case 'enum':
      return 'hint: use one of the documented enum values';
    case 'type':
      return 'hint: correct the field type to match the contract';
    case 'maxLength':
      return 'hint: shorten this field to the contract budget';
    default:
      return 'hint: align this value with docs/cmds.md contract examples';
  }
}

export async function validateContract(
  schemaName: Exclude<SchemaName, 'envelope'>,
  payload: unknown,
  filePath: string,
): Promise<void> {
  for (const name of schemaNames) {
    if (!validators.has(name)) {
      const schema = await loadSchema(name);
      validators.set(name, ajv.compile(schema));
    }
  }

  const envelopeValidator = validators.get('envelope');
  if (!envelopeValidator) throw new Error('Envelope validator missing');
  const typeValidator = validators.get(schemaName);
  if (!typeValidator) throw new Error(`Validator missing for ${schemaName}`);

  const envelopeOk = envelopeValidator(payload);
  if (!envelopeOk) {
    const first = envelopeValidator.errors?.[0];
    if (!first) throw new Error('Unknown envelope validation error');
    throw new Error(
      `${filePath} failed validation\nfield: ${first.instancePath || '/'}\nexpected: ${formatAjvError(first)}\n${hintForError(first)}`,
    );
  }

  const typeOk = typeValidator(payload);
  if (!typeOk) {
    const first = typeValidator.errors?.[0];
    if (!first) throw new Error('Unknown type validation error');
    throw new Error(
      `${filePath} failed validation\nfield: ${first.instancePath || '/'}\nexpected: ${formatAjvError(first)}\n${hintForError(first)}`,
    );
  }
}
