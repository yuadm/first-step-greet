-- Add trigger to automatically expire signing links after completion
CREATE OR REPLACE FUNCTION expire_signing_link_on_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status changes to 'signed', immediately expire the link
  IF NEW.status = 'signed' AND OLD.status != 'signed' THEN
    NEW.expired_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for signing request recipients
DROP TRIGGER IF EXISTS expire_signing_link_trigger ON signing_request_recipients;
CREATE TRIGGER expire_signing_link_trigger
  BEFORE UPDATE ON signing_request_recipients
  FOR EACH ROW
  EXECUTE FUNCTION expire_signing_link_on_completion();