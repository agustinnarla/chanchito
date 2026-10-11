-- Spec 006: an emoji per category, from the curated list in packages/core (CATEGORY_EMOJIS).

-- The key of a Fluent Emoji 3D image the web app ships. The database only checks its format;
-- packages/core checks it is in the list and shows the default for keys it doesn't know.
alter table public.categories
  add column emoji text not null default 'package',
  add constraint categories_emoji_format check (emoji ~ '^[a-z0-9_]{1,40}$');

-- Existing categories named like a suggested one get its emoji (same mapping as packages/core).
update public.categories
set emoji = suggested.emoji
from (
  values
    ('expense'::public.category_kind, 'supermercado', 'shopping_cart'),
    ('expense', 'alquiler', 'house'),
    ('expense', 'expensas', 'office_building'),
    ('expense', 'servicios', 'light_bulb'),
    ('expense', 'transporte', 'bus'),
    ('expense', 'salud', 'pill'),
    ('expense', 'salidas', 'clinking_beer_mugs'),
    ('expense', 'compras', 'shopping_bags'),
    ('expense', 'educación', 'books'),
    ('expense', 'suscripciones', 'television'),
    ('expense', 'otros gastos', 'package'),
    ('income', 'sueldo', 'briefcase'),
    ('income', 'freelance', 'laptop'),
    ('income', 'otros ingresos', 'money_bag')
) as suggested (kind, name, emoji)
where categories.kind = suggested.kind
  and lower(categories.name) = suggested.name;

-- The emoji can be set when creating a category and changed later, like the name.
grant insert (emoji) on table public.categories to authenticated;
grant update (emoji) on table public.categories to authenticated;
