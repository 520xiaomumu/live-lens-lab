-- Increase slug column length to support longer slugs
ALTER TABLE public.deployments 
ALTER COLUMN slug TYPE character varying(100);