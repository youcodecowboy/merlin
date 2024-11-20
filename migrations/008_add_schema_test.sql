-- Create a function to test schema modification permissions
CREATE OR REPLACE FUNCTION test_schema_permissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to create a temporary table to test DDL permissions
  CREATE TEMPORARY TABLE _temp_permission_test (
    id serial PRIMARY KEY,
    test_column text
  );
  
  -- Drop the temporary table
  DROP TABLE _temp_permission_test;
END;
$$;