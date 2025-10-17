-- Create trigger to keep employees.branch_id and employees.branch in sync
DROP TRIGGER IF EXISTS sync_employee_branch_trigger ON public.employees;
CREATE TRIGGER sync_employee_branch_trigger
BEFORE INSERT OR UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.sync_employee_branch_id();

-- Backfill existing employees to ensure branch_id matches branch name
UPDATE public.employees e
SET branch_id = b.id
FROM public.branches b
WHERE e.branch IS NOT NULL
  AND b.name = e.branch
  AND (e.branch_id IS DISTINCT FROM b.id);

-- Optional: also ensure branch text is in sync when only branch_id exists
UPDATE public.employees e
SET branch = b.name
FROM public.branches b
WHERE e.branch_id IS NOT NULL
  AND b.id = e.branch_id
  AND (e.branch IS DISTINCT FROM b.name);
