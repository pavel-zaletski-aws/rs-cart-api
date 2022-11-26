create table carts (
	id uuid primary key default uuid_generate_v4(),
	created_at date not null,
	updated_at date not null
)

create table cart_items (
	cart_id uuid,
	product_id uuid,
	count integer,
	foreign key ("cart_id") references "carts" ("id"),
	foreign key ("product_id") references "products" ("id")
)
