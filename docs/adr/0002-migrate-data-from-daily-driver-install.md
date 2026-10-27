# Saved data is migrated, not discarded, once the app is a daily driver

Until Habitron was installed on a phone for daily use, a change to the shape of saved data bumped the stored version and discarded anything saved under an older one, and backups only accepted the current version. That kept the code free of migrations while there was no real history to lose. From the version first installed as a daily driver onwards, every change to the saved shape ships with a migration from the previous version, and importing an older backup runs the same migrations, because a version bump would otherwise silently wipe months of check-ins.

Baseline version: _to be filled in on install day_.
