# Local database

You need a Postgres 15+ on your machine. Any of these works:

```sh
# system service (Fedora: sudo dnf install postgresql-server && sudo postgresql-setup --initdb)
sudo systemctl start postgresql

# or a container
podman run -d --name f1store-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 docker.io/library/postgres:17-alpine
```

## First time

```sh
psql -h localhost -U postgres -c 'create database f1store'
cp .env.example .env        # set DATABASE_URL=postgresql://postgres:<password>@localhost:5432/f1store
npm run db:migrate          # tables
npm run db:seed             # starter catalogue + settings (downloads Bburago photos into ./.media)
npm run dev                 # http://localhost:3000, admin at http://localhost:3000$ADMIN_PATH
```

`npm run dev` first checks the database is reachable and warns about unapplied migrations.

Without `DATABASE_URL` the site still runs and shows the starter content read-only (no images, nothing can be ordered).

## Reset to clean starter data

```sh
psql "postgresql://postgres:<password>@localhost:5432/postgres" -c 'drop database f1store with (force)' -c 'create database f1store'
rm -rf .media .next          # old images and the page cache
npm run db:migrate && npm run db:seed
```

Deleting `.next` matters: the seed bypasses the admin, so the cached pages would otherwise still show the old data. (In a running app, **Refresh public pages** on the dashboard does the same.)

## Useful

| Command | Does |
|---|---|
| `npm run db:studio` | Browse and edit tables in the browser |
| `npm test` | Integration tests create and drop their own `test_xxxx` database next to yours; your data isn't touched |
