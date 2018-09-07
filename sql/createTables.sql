CREATE TABLE public.passwords
(
	id			bigint,
	name		character varying(256),
	hash		character varying(256),
	username	character varying(256),
	notes		character varying(256),
	
	CONSTRAINT pk_id PRIMARY KEY (id)
) 
WITH (
  OIDS = FALSE
);

CREATE SEQUENCE public.sq_pwd;