# Makefile for managing PostgreSQL database operations

# Database configuration
DB_NAME=d5r8fucf69j020
DB_USER=fbxoxiesqtumdq
DB_HOST=ec2-3-228-117-228.compute-1.amazonaws.com
DB_PASSWORD=f4c824ec71022ae181240b7f46a73182cd52d5f687610133a90ea601a3bbe72f

# SQL files
COMMENTS_SQL=comments.sql

.PHONY: all comments

all: comments

comments:
	@echo "Executing comments SQL commands..."
	PGPASSWORD=$(DB_PASSWORD) psql -d $(DB_NAME) -U $(DB_USER)  -h $(DB_HOST) -w -f $(COMMENTS_SQL)

