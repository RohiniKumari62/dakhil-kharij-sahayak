create or replace function apply_transition(
  p_application_id uuid,
  p_actor_id uuid,
  p_actor_role app_role,
  p_event text,
  p_from app_step,
  p_to app_step,
  p_new_status app_status,
  p_note text
) returns void as $$
declare
  current_row applications%rowtype;
begin
  select * into current_row from applications
    where id = p_application_id for update;
  if not found then
    raise exception 'application not found';
  end if;
  if current_row.current_step <> p_from or current_row.status <> 'IN_PROGRESS' then
    raise exception 'application changed, please reload';
  end if;

  update applications
    set current_step = p_to, status = p_new_status, updated_at = now()
    where id = p_application_id;

  insert into audit_events
    (application_id, actor_id, actor_role, event_type, from_step, to_step, note)
  values
    (p_application_id, p_actor_id, p_actor_role, p_event, p_from, p_to, p_note);
end;
$$ language plpgsql;

revoke execute on function apply_transition(uuid, uuid, app_role, text, app_step, app_step, app_status, text)
  from public, anon, authenticated;
grant execute on function apply_transition(uuid, uuid, app_role, text, app_step, app_step, app_status, text)
  to service_role;
