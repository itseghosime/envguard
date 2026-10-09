#!/usr/bin/env node
import { runCli } from "./cli/commands.js";

const exitCode = runCli(process.argv.slice(2));
process.exitCode = exitCode;
