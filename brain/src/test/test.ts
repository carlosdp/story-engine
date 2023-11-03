import fs from 'node:fs';
import path from 'node:path';

import { Designer } from '../subsystems/designer.js';

const filePath = path.join('brain/src/test', 'document.md');
const documentText = fs.readFileSync(filePath, 'utf8');

const designer = new Designer();
await designer.createSignal('6d2cb791-703c-4ea4-afbf-a605fbad68b0', { documentText });

// eslint-disable-next-line
process.exit();
