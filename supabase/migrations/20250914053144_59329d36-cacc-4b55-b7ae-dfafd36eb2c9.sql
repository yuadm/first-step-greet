-- Fix search path security warnings for the new functions
ALTER FUNCTION public.adjust_employee_leave_balance(UUID, INTEGER, TEXT) SET search_path TO 'public';
ALTER FUNCTION public.update_leave_status_with_balance(UUID, TEXT, TEXT, UUID) SET search_path TO 'public';