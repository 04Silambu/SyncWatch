-- Migration script to add genre_confidence column to history table
-- Run this to update the database schema for ML integration

ALTER TABLE history ADD COLUMN genre_confidence REAL DEFAULT 0.0;

-- Verify the change
SELECT sql FROM sqlite_master WHERE name = 'history';
