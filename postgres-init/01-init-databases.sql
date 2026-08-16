-- Cria os bancos de dados de cada microsserviço.
-- O container postgres do docker-compose só cria automaticamente o banco
-- definido em POSTGRES_DB (taskflow_auth); os demais precisam ser criados aqui.
SELECT 'CREATE DATABASE taskflow_user' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'taskflow_user')\gexec
SELECT 'CREATE DATABASE taskflow_task' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'taskflow_task')\gexec
SELECT 'CREATE DATABASE taskflow_notification' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'taskflow_notification')\gexec
