/*
# Add instagram_username column to settings

Adds a field to store the Instagram username (e.g., @gelaf_1) separately from the full URL.
*/

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS instagram_username text DEFAULT '@gelaf_1';
