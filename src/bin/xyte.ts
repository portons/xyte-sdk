#!/usr/bin/env node

import { runCli } from '../cli/index';
import { toProblemDetails } from '../contracts/problem';

runCli().catch((error) => {
  const wantsJson = process.argv.includes('--error-format') && process.argv.includes('json');
  if (wantsJson || process.env.XYTE_ERROR_FORMAT === 'json') {
    process.stderr.write(`${JSON.stringify(toProblemDetails(error), null, 2)}\n`);
    process.exit(1);
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
