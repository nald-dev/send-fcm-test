CREATE TABLE accounts (                                                                   
  id SERIAL PRIMARY KEY,
  regid TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);