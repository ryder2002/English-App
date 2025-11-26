#!/usr/bin/env node
/**
 * Quick Migration Script - Migrate multiple APIs at once
 * Usage: npm run api:quick-migrate
 */
import fs from 'fs';
import path from 'path';
const migrations = [
  // Auth APIs - All public
  {
    file: 'src/app/api/auth/register/route.ts',
    helper: 'withPublic',
    imports: `import { withPublic, APIContext, parseBody, errorResponse } from '@/lib/api-gateway';
import { AuthService } from '@/lib/services/auth-service';`,
  },
  {
    file: 'src/app/api/auth/logout/route.ts',
    helper: 'withAuth',
    imports: `import { withAuth, APIContext, successResponse } from '@/lib/api-gateway';`,
  },
  {
    file: 'src/app/api/auth/me/route.ts',
    helper: 'withAuth',
    imports: `import { withAuth, APIContext, successResponse, errorResponse } from '@/lib/api-gateway';
import prisma from '@/lib/prisma';`,
  },
  {
    file: 'src/app/api/auth/change-password/route.ts',
    helper: 'withAuth',
    imports: `import { withAuth, APIContext, parseBody, successResponse, errorResponse } from '@/lib/api-gateway';
import { AuthService } from '@/lib/services/auth-service';`,
  },
  {
    file: 'src/app/api/auth/forgot-password/route.ts',
    helper: 'withPublic',
    imports: `import { withPublic, APIContext, parseBody, successResponse, errorResponse } from '@/lib/api-gateway';
import { sendPasswordResetEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import crypto from 'crypto';`,
  },
  {
    file: 'src/app/api/auth/reset-password/route.ts',
    helper: 'withPublic',
    imports: `import { withPublic, APIContext, parseBody, successResponse, errorResponse } from '@/lib/api-gateway';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';`,
  },
];

console.log('🚀 Quick Migration Tool\n');
console.log(`📝 Will migrate ${migrations.length} files\n`);

migrations.forEach((migration, index) => {
  const filePath = path.join(process.cwd(), migration.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${migration.file}`);
    return;
  }

  console.log(`${index + 1}. ${migration.file}`);
  console.log(`   Helper: ${migration.helper}`);
  console.log(`   ✅ Ready to migrate\n`);
});

console.log('\n💡 To migrate, manually update each file with:');
console.log('1. Replace imports with API Gateway imports');
console.log('2. Convert function to async handler with APIContext');
console.log('3. Replace export with helper (withAuth/withPublic/withAdmin)');
console.log('4. Use successResponse() and errorResponse()');
console.log('\nOr run the automated migration (coming soon)!\n');

export {};
