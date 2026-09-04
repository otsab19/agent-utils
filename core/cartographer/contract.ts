/**
 * Legacy Code Cartographer — Behavior Contract Serializer
 *
 * Records test execution results into an immutable behavior contract.
 * Once sealed, the contract must be reviewed before source modifications are allowed.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export interface BehaviorEntry {
  functionName: string;
  inputs: unknown[];
  output: unknown;
  threwException: boolean;
  exceptionMessage?: string;
  executionTimeMs: number;
}

export interface BehaviorContract {
  version: '1.0';
  sealed: boolean;
  sealedAt: string;
  sourceFile: string;
  contentHash: string;
  entries: BehaviorEntry[];
}

/**
 * Seals a behavior contract and writes it to disk.
 * Once sealed, the contract is immutable (hash-verified).
 *
 * @param sourceFilePath - Path to the source file being contracted
 * @param entries - Recorded behavior entries
 * @param outputDir - Directory to write the contract
 */
export async function sealContract(
  sourceFilePath: string,
  entries: BehaviorEntry[],
  outputDir: string
): Promise<string> {
  const sourceContent = await fs.readFile(sourceFilePath, 'utf8');
  const contentHash = crypto.createHash('sha256').update(sourceContent).digest('hex');

  const contract: BehaviorContract = {
    version: '1.0',
    sealed: true,
    sealedAt: new Date().toISOString(),
    sourceFile: sourceFilePath,
    contentHash,
    entries,
  };

  await fs.mkdir(outputDir, { recursive: true });
  const contractPath = path.join(
    outputDir,
    `${path.basename(sourceFilePath, path.extname(sourceFilePath))}.contract.json`
  );

  await fs.writeFile(contractPath, JSON.stringify(contract, null, 2), 'utf8');
  return contractPath;
}

/**
 * Verifies that a source file matches its sealed contract.
 * Returns false if the source has changed since the contract was sealed.
 */
export async function verifyContract(contractPath: string): Promise<boolean> {
  const contractContent = await fs.readFile(contractPath, 'utf8');
  const contract: BehaviorContract = JSON.parse(contractContent);

  const sourceContent = await fs.readFile(contract.sourceFile, 'utf8');
  const currentHash = crypto.createHash('sha256').update(sourceContent).digest('hex');

  return currentHash === contract.contentHash;
}
