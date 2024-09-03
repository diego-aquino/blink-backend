import database from '@/database/client';

async function dropTestSchemas() {
  await database.initialize();

  console.log('Dropping test schemas...');

  const dropLabel = 'Test schemas dropped:';
  console.time(dropLabel);

  await database.client.$executeRawUnsafe(`
    DO $$
    DECLARE
      schema_name_to_drop TEXT;
    BEGIN
      FOR schema_name_to_drop IN
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name LIKE 'test_worker_%'
      LOOP
        EXECUTE 'DROP SCHEMA ' || schema_name_to_drop || ' CASCADE';
      END LOOP;
    END $$;
  `);

  console.timeEnd(dropLabel);
}

void dropTestSchemas();
