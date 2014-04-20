\set ON_ERROR_STOP 1
BEGIN;

-----------------------
-- CREATE NEW COLUMN --
-----------------------

ALTER TABLE link_type ADD COLUMN has_dates BOOLEAN NOT NULL DEFAULT TRUE;

---------------------------------
-- MAKE ALL HAVE DATES FOR NOW --
---------------------------------

UPDATE link_type SET has_dates = true;

COMMIT;
