// Saved data as both the store and backups hold it: `habits` is shared, the store also keeps `darkMode`
export type SavedData = Record<string, unknown>;

// Moves saved data up exactly one version
export type Migration = (data: SavedData) => SavedData;

export interface MigrationChain {
  version: number;
  migrate: (data: SavedData, fromVersion: number) => SavedData;
}

// The chain starts at `baseline`; each step lifts data one version, so the current version is
// `baseline + steps.length`. Data from before the baseline or after the current version can't be
// read and is refused rather than discarded
export const createMigrationChain = (baseline: number, steps: Migration[]): MigrationChain => {
  const version = baseline + steps.length;

  return {
    version,
    migrate: (data, fromVersion) => {
      if (!Number.isInteger(fromVersion) || fromVersion < baseline || fromVersion > version) {
        throw new Error(
          `This data was saved by version ${fromVersion} of Habitron, which this version (${version}) can't read.`
        );
      }
      return steps.slice(fromVersion - baseline).reduce((migrated, step) => step(migrated), data);
    }
  };
};

// Per ADR 0002, every change to the saved shape adds a step here instead of discarding older data.
// Used both when stored data loads and when a backup is imported
export const savedDataMigrations = createMigrationChain(5, []);

// The `version` and `migrate` options for zustand's `persist`, so stored data runs the same chain.
// A failed migration surfaces through `onRehydrateStorage` and leaves the stored data untouched
export const persistMigrations = <T>(chain: MigrationChain) => ({
  version: chain.version,
  migrate: (state: unknown, fromVersion: number) => chain.migrate(state as SavedData, fromVersion) as T
});
