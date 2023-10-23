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
