-- Add qr_codes column to batches table
ALTER TABLE batches
ADD COLUMN qr_codes JSONB DEFAULT '[]';

-- Create index for qr_codes
CREATE INDEX idx_batches_qr_codes ON batches USING GIN (qr_codes);

-- Update existing batches with QR codes from inventory items
UPDATE batches b
SET qr_codes = (
    SELECT jsonb_agg(i.qr_code)
    FROM inventory_items i
    WHERE i.batch_id = b.id
    AND i.qr_code IS NOT NULL
)
WHERE true;