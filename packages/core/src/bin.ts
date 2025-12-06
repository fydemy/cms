#!/usr/bin/env node

import { initCMS } from "./init/setup";

initCMS().catch((err: unknown) => {
  console.error("Error initializing CMS:", err);
  process.exit(1);
});
