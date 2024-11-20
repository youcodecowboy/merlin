-- Create a function to test schema permissions
CREATE OR REPLACE FUNCTION test_schema_permissions()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_table_name text := '_test_' || floor(random() * 1000000)::text;
    can_create boolean := false;
    can_alter boolean := false;
    can_drop boolean := false;
BEGIN
    -- Test CREATE permission
    EXECUTE format('
        CREATE TABLE %I (
            id serial PRIMARY KEY,
            test_column text
        )', test_table_name);
    can_create := true;

    -- Test ALTER permission
    EXECUTE format('
        ALTER TABLE %I 
        ADD COLUMN test_column2 text', test_table_name);
    can_alter := true;

    -- Test DROP permission
    EXECUTE format('DROP TABLE %I', test_table_name);
    can_drop := true;

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        -- Clean up if table exists
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS %I', test_table_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        
        RETURN false;
END;
$$;