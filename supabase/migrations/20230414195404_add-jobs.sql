  BEGIN;
    SET LOCAL statement_timeout = '30s';
    SELECT pg_advisory_xact_lock(
      ('x' || md5(current_database() || '.pgboss.public'))::bit(64)::bigint
  );
    
  CREATE SCHEMA IF NOT EXISTS public;

    CREATE TABLE public.version (
      version int primary key,
      maintained_on timestamp with time zone,
      cron_on timestamp with time zone
    )
  ;

    CREATE TYPE public.job_state AS ENUM (
      'created',
      'retry',
      'active',
      'completed',
      'expired',
      'cancelled',
      'failed'
    )
  ;

    CREATE TABLE public.job (
      id uuid primary key not null default gen_random_uuid(),
      name text not null,
      priority integer not null default(0),
      data jsonb,
      state public.job_state not null default('created'),
      retryLimit integer not null default(0),
      retryCount integer not null default(0),
      retryDelay integer not null default(0),
      retryBackoff boolean not null default false,
      startAfter timestamp with time zone not null default now(),
      startedOn timestamp with time zone,
      singletonKey text,
      singletonOn timestamp without time zone,
      expireIn interval not null default interval '15 minutes',
      createdOn timestamp with time zone not null default now(),
      completedOn timestamp with time zone,
      keepUntil timestamp with time zone NOT NULL default now() + interval '14 days',
      on_complete boolean not null default false,
      output jsonb
    )
  ;
CREATE TABLE public.archive (LIKE public.job);

    CREATE TABLE public.schedule (
      name text primary key,
      cron text not null,
      timezone text,
      data jsonb,
      options jsonb,
      created_on timestamp with time zone not null default now(),
      updated_on timestamp with time zone not null default now()
    )
  ;

    CREATE TABLE public.subscription (
      event text not null,
      name text not null,
      created_on timestamp with time zone not null default now(),
      updated_on timestamp with time zone not null default now(),
      PRIMARY KEY(event, name)
    )
  ;
CREATE INDEX archive_id_idx ON public.archive(id);
ALTER TABLE public.archive ADD archivedOn timestamptz NOT NULL DEFAULT now();
CREATE INDEX archive_archivedon_idx ON public.archive(archivedon);

    CREATE INDEX job_name ON public.job (name text_pattern_ops)
  ;

    CREATE INDEX job_fetch ON public.job (name text_pattern_ops, startAfter) WHERE state < 'active'
  ;

    CREATE UNIQUE INDEX job_singletonOn ON public.job (name, singletonOn) WHERE state < 'expired' AND singletonKey IS NULL
  ;

    CREATE UNIQUE INDEX job_singletonKeyOn ON public.job (name, singletonOn, singletonKey) WHERE state < 'expired'
  ;

    CREATE UNIQUE INDEX job_singletonKey ON public.job (name, singletonKey) WHERE state < 'completed' AND singletonOn IS NULL AND NOT singletonKey LIKE '\_\_pgboss\_\_singleton\_queue%'
  ;

    CREATE UNIQUE INDEX job_singleton_queue ON public.job (name, singletonKey) WHERE state < 'active' AND singletonOn IS NULL AND singletonKey LIKE '\_\_pgboss\_\_singleton\_queue%'
  ;
INSERT INTO public.version(version) VALUES ('20');
    COMMIT;
  