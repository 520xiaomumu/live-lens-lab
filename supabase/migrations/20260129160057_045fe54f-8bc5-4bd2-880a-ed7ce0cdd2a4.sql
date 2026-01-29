-- Add notes column to deployments table for storing page remarks
ALTER TABLE public.deployments 
ADD COLUMN notes text;