/*
 * Cinelog API layer — barrel export.
 *
 * Import only what you need from specific modules to keep bundles small.
 * Nothing in this module calls the backend automatically —
 * all calls are explicit in screens/hooks that use them.
 */

export * from './errors';
export * from './client';
export * from './auth';
export * from './movies';
export * from './watchEntries';
export * from './actors';
