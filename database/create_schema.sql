CREATE SCHEMA IF NOT EXISTS public;
   GRANT USAGE, CREATE ON SCHEMA public TO postgres;  -- optional, but usually fine
   ALTER ROLE postgres SET search_path = public;
   CREATE TABLE users (
            user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL
  );
  
  -- Datasets created by users
  CREATE TABLE datasets (
            dataset_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            name TEXT,
            search_term TEXT,
            total_images INTEGER NOT NULL,
            provider_offsets JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL
  );
  
  -- 1) create the enum type
  CREATE TYPE image_status AS ENUM ('pending', 'approved', 'rejected');
  
  -- 2) use it in the table
  CREATE TABLE images (
            image_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            dataset_id BIGINT NOT NULL REFERENCES datasets(dataset_id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            title TEXT,
            license TEXT,
            status image_status NOT NULL DEFAULT 'pending',
            added_at TIMESTAMPTZ NOT NULL
 );
 