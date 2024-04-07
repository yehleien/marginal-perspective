-- comments.sql
-- SQL commands to manage the comments in the database

-- Example: Select all comments
SELECT "id", SUBSTRING("text" FROM 1 FOR 10) AS "text", "parentID", "userId", "articleId", "upvotes", "downvotes", "replyCount", "createdAt" FROM "Comments" limit 5;



-- Add more SQL commands as needed