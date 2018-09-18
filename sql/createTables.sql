CREATE TABLE public.passwords
(
	id			bigint,
	name		character varying(256),
	salt		character varying(256),
	hash		character varying(256),
	username	character varying(256),
	notes		character varying(256),
	
	CONSTRAINT pk_id PRIMARY KEY (id)
) 
WITH (
  OIDS = FALSE
);

ALTER table public.passwords
  OWNER TO passwd;

CREATE SEQUENCE public.sq_pwd;
ALTER SEQUENCE sq_pwd
  OWNER TO passwd;