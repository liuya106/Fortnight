--- load with 
--- psql "dbname='webdb' user='webdbuser' password='password' host='localhost'" -f schema.sql
DROP TABLE ftduser;
CREATE TABLE ftduser (
	username VARCHAR(20) PRIMARY KEY,
	password BYTEA NOT NULL
);


CREATE TABLE profile (
	username VARCHAR(20) FOREIGN KEY NOT NULL,
	name VARCHAR(30),
	gender VARCHAR(10)
)

CREATE TABLE stats(
	username VARCHAR(20) FOREIGN KEY NOT NULL,
	kill INT DEFAULT 0,
	death INT DEFAULT 0,
	consumed_bullets INT DEFAULT 0
)
--- Could have also stored as 128 character hex encoded values
--- select char_length(encode(sha512('abc'), 'hex')); --- returns 128
INSERT INTO ftduser VALUES('user1', sha512('password1'));
INSERT INTO ftduser VALUES('user2', sha512('password2'));
