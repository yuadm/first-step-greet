
-- 1) One-time data repair to sync branches

-- Normalize whitespace in names to improve matching
UPDATE public.branches SET name = trim(name) WHERE name IS NOT NULL;
UPDATE public.employees SET branch = trim(branch) WHERE branch IS NOT NULL;

-- a) Set branch_id using branch name when possible
UPDATE public.employees e
SET branch_id = b.id
FROM public.branches b
WHERE e.branch IS NOT NULL
  AND lower(e.branch) = lower(b.name)
  AND (e.branch_id IS DISTINCT FROM b.id);

-- b) Ensure branch text matches branch_id's name
UPDATE public.employees e
SET branch = b.name
FROM public.branches b
WHERE e.branch_id = b.id
  AND (e.branch IS NULL OR e.branch <> b.name);

-- 2) Add trigger to keep them in sync going forward
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'sync_employee_branch_id_trigger'
  ) THEN
    CREATE TRIGGER sync_employee_branch_id_trigger
    BEFORE INSERT OR UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_employee_branch_id();
  END IF;
END
$$;
