#!/usr/bin/env node
// Prints the plain-language summary (Markdown) of a MatchReportV1 file:  node scripts/alpha-report-summary.mjs <report.json> [--csv]
import { readFileSync } from 'node:fs';
import { MatchReportV1Schema, matchReportToCsv, matchReportToMarkdown } from '../packages/game-domain/dist/index.js';
const file = process.argv[2];
if (!file) { console.error('usage: alpha-report-summary.mjs <report.json> [--csv]'); process.exit(2); }
const report = MatchReportV1Schema.parse(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(process.argv.includes('--csv') ? matchReportToCsv(report) : matchReportToMarkdown(report));
