CREATE TABLE "users"
(
  "username" varchar(20) UNIQUE PRIMARY KEY NOT NULL CHECK (username = lower(username)),
  "password" text NOT NULL,
  "first_name" varchar(30) NOT NULL,
  "last_name" varchar(30) NOT NULL,
  "email" varchar(60) NOT NULL CHECK (position('@' IN email) > 1),
  "phone" varchar(20) DEFAULT '',
  "image" text DEFAULT '',
  "role" integer NOT NULL DEFAULT 0,
  "updated" timestamp NOT NULL DEFAULT (now()),
  "created" timestamp NOT NULL DEFAULT (now()),
  "pwd_token" text DEFAULT '',
  "is_active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "users_follow"
(
  "username" varchar(20) NOT NULL,
  "following" varchar(20) NOT NULL,
  PRIMARY KEY ("username", "following")
);

CREATE TABLE "users_tours_follow"
(
  "username" varchar(20) NOT NULL,
  "tour_id" SERIAL,
  PRIMARY KEY ("username", "tour_id")
);

CREATE TABLE "tours"
(
  "id" SERIAL PRIMARY KEY,
  "slug" varchar(50) NOT NULL CHECK (slug = lower(slug)),
  "title" text NOT NULL,
  "image" text,
  "guaranteed" integer NOT NULL DEFAULT 0,
  "description" text,
  "creator" varchar(20) NOT NULL,
  "price" integer NOT NULL DEFAULT 0 CHECK(price>=0),
  "entry_fee" integer NOT NULL DEFAULT 0 CHECK(entry_fee>=0),
  "start" timestamp NOT NULL,
  "setting" text NOT NULL DEFAULT '',
  "clock_setting" text NOT NULL DEFAULT '',
  "status" integer NOT NULL DEFAULT 0,
  "start_time" timestamp,
  "end_time" timestamp,
  "is_active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "tours_templates"
(
  "id" SERIAL PRIMARY KEY,
  "title" text NOT NULL,
  "image" text,
  "guaranteed" integer NOT NULL DEFAULT 0,
  "description" text,
  "creator" varchar(20) NOT NULL,
  "price" integer NOT NULL DEFAULT 0 CHECK(price>=0),
  "entry_fee" integer NOT NULL DEFAULT 0 CHECK(entry_fee>=0),
  "setting" text NOT NULL DEFAULT '',
  "is_public" boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE "tours_players"
(
  "tour_id" SERIAL,
  "username" varchar(20) NOT NULL,
  "signup_time" timestamp NOT NULL DEFAULT (now()),
  "place" integer NOT NULL DEFAULT 0,
  "prize" text NOT NULL DEFAULT '',
  PRIMARY KEY ("tour_id", "username")
);

ALTER TABLE "users_follow" ADD FOREIGN KEY ("username") REFERENCES "users" ("username")  ON DELETE CASCADE;

ALTER TABLE "users_follow" ADD FOREIGN KEY ("following") REFERENCES "users" ("username") ON DELETE CASCADE;

ALTER TABLE "users_tours_follow" ADD FOREIGN KEY ("username") REFERENCES "users" ("username") ON DELETE CASCADE;

ALTER TABLE "users_tours_follow" ADD FOREIGN KEY ("tour_id") REFERENCES "tours" ("id") ON DELETE CASCADE;

ALTER TABLE "tours" ADD FOREIGN KEY ("creator") REFERENCES "users" ("username")
ON DELETE CASCADE;

ALTER TABLE "tours_players" ADD FOREIGN KEY ("tour_id") REFERENCES "tours" ("id")
ON DELETE CASCADE;

ALTER TABLE "tours_players" ADD FOREIGN KEY ("username") REFERENCES "users" ("username")
ON DELETE CASCADE;

ALTER TABLE "tours_templates" ADD FOREIGN KEY ("creator") REFERENCES "users" ("username") ON DELETE CASCADE;


CREATE INDEX idx_tours_slug ON tours(slug);
