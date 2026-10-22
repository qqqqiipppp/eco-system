import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
// Frozen historical JSON files are inputs, never the destination of a new run.
export const resultsDirectory=process.env.TEST_RESULTS_DIR||mkdtempSync(join(tmpdir(),'forest-tests-'));
mkdirSync(resultsDirectory,{recursive:true});
export const resultFile=name=>join(resultsDirectory,name);
