CREATE OR REPLACE FUNCTION public.admin_delete_user_identities(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
  DELETE FROM auth.identities WHERE user_id = target_user_id;
END;
$$;
