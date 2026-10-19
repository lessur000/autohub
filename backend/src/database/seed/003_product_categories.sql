-- AutoHub: Development product-category relationships

INSERT INTO product_categories (
    product_id,
    category_id
)
SELECT
    p.id,
    c.id
FROM (
    VALUES
        ('AH-ENG-001', 'engine-parts'),
        ('AH-ENG-002', 'engine-parts'),
        ('AH-BRK-001', 'brake-system'),
        ('AH-BRK-002', 'brake-system'),
        ('AH-ELE-001', 'electrical-parts'),
        ('AH-ELE-002', 'electrical-parts'),
        ('AH-SUS-001', 'suspension-steering'),
        ('AH-FLT-001', 'filters-fluids'),
        ('AH-EXT-001', 'exterior-accessories'),
        ('AH-INT-001', 'interior-accessories'),
        ('AH-TOL-001', 'tools-equipment')
) AS seed(sku, category_slug)
JOIN products p
    ON p.sku = seed.sku
JOIN categories c
    ON c.slug = seed.category_slug
ON CONFLICT (product_id, category_id)
DO NOTHING;