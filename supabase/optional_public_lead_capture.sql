-- OPTIONAL: lets your website contact form (or a Zapier / Make webhook) push a lead straight into the CRM
-- without logging in. Call it from your website with the anon key:
--   supabase.rpc('capture_lead', { p_name:'Ali', p_phone:'+9715...', p_email:'', p_source:'Website', p_message:'Interested in Marina' })
create or replace function public.capture_lead(
  p_name text, p_phone text, p_email text default '', p_source text default 'Website',
  p_area text default '', p_budget numeric default 0, p_message text default ''
) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if coalesce(trim(p_name),'') = '' then raise exception 'name required'; end if;
  insert into public.leads (name, phone, email, source, preferred_area, budget, notes)
  values (left(p_name,120), left(coalesce(p_phone,''),40), left(coalesce(p_email,''),160), left(p_source,60),
          left(coalesce(p_area,''),80), coalesce(p_budget,0), left(coalesce(p_message,''),1000))
  returning id into new_id;
  return new_id;
end $$;
grant execute on function public.capture_lead(text,text,text,text,text,numeric,text) to anon;
