-- both test users have the password "password"

INSERT INTO users
    (username, password, first_name, last_name, email, phone , image , role , pwd_token , is_active)
VALUES
    (
        'testuser',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'Test',
        'User',
        'joel@joelburton.com',
        '' ,
        '' ,
        0 ,
        '',
        TRUE
);