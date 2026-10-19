-- AutoHub: Development category seed
-- Safe to rerun based on unique category slug.

INSERT INTO categories (
    name,
    slug,
    description,
    is_active
)
VALUES
    (
        'Engine Parts',
        'engine-parts',
        'Engine components and replacement parts.',
        TRUE
    ),
    (
        'Brake System',
        'brake-system',
        'Brake pads, discs, and related components.',
        TRUE
    ),
    (
        'Electrical Parts',
        'electrical-parts',
        'Automotive electrical components and accessories.',
        TRUE
    ),
    (
        'Suspension and Steering',
        'suspension-steering',
        'Suspension and steering replacement parts.',
        TRUE
    ),
    (
        'Filters and Fluids',
        'filters-fluids',
        'Oil filters, air filters, and automotive fluids.',
        TRUE
    ),
    (
        'Exterior Accessories',
        'exterior-accessories',
        'Exterior accessories and vehicle add-ons.',
        TRUE
    ),
    (
        'Interior Accessories',
        'interior-accessories',
        'Interior accessories and cabin essentials.',
        TRUE
    ),
    (
        'Tools and Equipment',
        'tools-equipment',
        'Automotive tools and maintenance equipment.',
        TRUE
    )
ON CONFLICT (slug)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = now();