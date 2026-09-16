-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "businessModel" TEXT,
    "targetCustomer" TEXT,
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'building',
    "proposalJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("businessModel", "createdAt", "description", "domain", "id", "industry", "name", "status", "targetCustomer", "updatedAt") SELECT "businessModel", "createdAt", "description", "domain", "id", "industry", "name", "status", "targetCustomer", "updatedAt" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
