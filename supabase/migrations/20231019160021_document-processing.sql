create table design_documents (
  id uuid primary key default gen_random_uuid(),
  world_id uuid references worlds(id) not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

create or replace function submit_design_document(world_id uuid, content text) returns uuid as $$
  declare
    design_document_id uuid;
  begin
    insert into design_documents (world_id, content)
    values (world_id, content)
    returning id into design_document_id;

    insert into public.job (name, data)
    values ('submitDesignDocument', json_build_object('designDocumentId', design_document_id)::json);

    return design_document_id;
  end;
$$ language plpgsql;

alter table thought_process_messages add column summary boolean default false;

-- function that returns thought_process_messages for a given thought_process_id, ordered by created_at, including only messages marked with summary set to true, and messages with summary set to false that were created after the last message marked with summary set to true
create or replace function compressed_thought_process_messages(thought_process_id uuid) returns setof thought_process_messages as $$
  declare
    last_summary_message_created_at timestamp with time zone;
  begin
    select created_at into last_summary_message_created_at
    from thought_process_messages tpm
    where tpm.thought_process_id = $1
    and summary = true
    order by created_at desc
    limit 1;

    if last_summary_message_created_at is null then
      return query
        select *
        from thought_process_messages tpm
        where tpm.thought_process_id = $1
        order by created_at asc;
    else
      return query
        select *
        from thought_process_messages tpm
        where tpm.thought_process_id = $1
        and (summary = true or created_at > last_summary_message_created_at)
        order by created_at asc;
    end if;
  end;
$$ language plpgsql;
