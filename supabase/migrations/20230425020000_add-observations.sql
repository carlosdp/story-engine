create extension vector with schema extensions;
create extension postgis with schema extensions;

create table observations (
  id uuid primary key default gen_random_uuid(),
  subsystem varchar not null,
  text text not null,
  embedding vector(1536) not null,
  location POINT,
  updated_observation_id uuid references observations(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

CREATE OR REPLACE FUNCTION search_observations (
  search_embedding VECTOR(1536),
  search_location POINT,
  decay_rate FLOAT,
  min_similarity FLOAT,
  max_range FLOAT
)
RETURNS TABLE (
  id UUID,
  subsystem VARCHAR,
  text TEXT,
  embedding VECTOR(1536),
  location POINT,
  updated_observation_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT,
  distance FLOAT,
  time_weight FLOAT,
  final_weight FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.subsystem,
    o.text,
    o.embedding,
    o.location,
    o.updated_observation_id,
    o.created_at,
    o.updated_at,
    -- Cosine similarity
    1 - (o.embedding <=> search_embedding) AS similarity,
    -- Distance between locations (if search_location is not null)
    CASE
      WHEN search_location IS NOT NULL THEN
        ST_Distance(o.location::geometry, search_location::geometry)
      ELSE
        NULL
    END AS distance,
    -- Time weight
    POWER(1.0 - decay_rate, EXTRACT(EPOCH FROM (now() - o.created_at)) / 3600) AS time_weight,
    -- Final weight (similarity * time_weight * location_weight)
    (1 - (o.embedding <=> search_embedding)) *
    POWER(1.0 - decay_rate, EXTRACT(EPOCH FROM (now() - o.created_at)) / 3600) *
    CASE
      WHEN search_location IS NOT NULL THEN
        (1 - LEAST(ST_Distance(o.location::geometry, search_location::geometry) / max_range, 1))
      ELSE
        1
    END AS final_weight
  FROM
    observations o
  WHERE
    -- Filter observations based on minimum similarity
    1 - (o.embedding <=> search_embedding) > min_similarity AND
    -- Filter observations based on maximum distance (if search_location is not null)
    (
      search_location IS NULL OR
      ST_Distance(o.location::geometry, search_location::geometry) <= max_range
    )
  ORDER BY
    -- Order by final weight
    final_weight DESC;
END;
$$;

alter table observations enable row level security;

create policy "Staff can read observations" on observations for select using (auth.uid() in (select user_id from profiles where is_staff = true));
