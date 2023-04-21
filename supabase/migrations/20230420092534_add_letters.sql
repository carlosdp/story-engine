create table letters (
    id uuid primary key default gen_random_uuid(),
    sender uuid references characters(id) not null,
    recipient uuid references characters(id) not null,
    content text not null,
    summary text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);