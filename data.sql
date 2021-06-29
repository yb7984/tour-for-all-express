\echo 'Delete and recreate tour_for_all db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE tour_for_all;
CREATE DATABASE tour_for_all;
\connect tour_for_all

\i data-schema.sql
\i data-seed.sql

\echo 'Delete and recreate tour_for_all_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE tour_for_all_test;
CREATE DATABASE tour_for_all_test;
\connect tour_for_all_test

\i data-schema.sql
