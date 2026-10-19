-- AutoHub: Development product seed
-- Sample products and prices only.
-- Do not treat these as actual supplier prices.

INSERT INTO products (
    sku,
    name,
    slug,
    description,
    price,
    currency,
    stock_quantity,
    is_active
)
VALUES
    (
        'AH-ENG-001',
        'Engine Oil Filter',
        'engine-oil-filter',
        'Sample replacement engine oil filter.',
        350.00,
        'PHP',
        50,
        TRUE
    ),
    (
        'AH-ENG-002',
        'Spark Plug Set',
        'spark-plug-set',
        'Sample spark plug set for development testing.',
        650.00,
        'PHP',
        30,
        TRUE
    ),
    (
        'AH-BRK-001',
        'Front Brake Pad Set',
        'front-brake-pad-set',
        'Sample brake pad set. Verify vehicle compatibility.',
        1250.00,
        'PHP',
        20,
        TRUE
    ),
    (
        'AH-BRK-002',
        'Brake Fluid',
        'brake-fluid',
        'Sample automotive brake fluid.',
        280.00,
        'PHP',
        40,
        TRUE
    ),
    (
        'AH-ELE-001',
        'Automotive LED Bulb',
        'automotive-led-bulb',
        'Sample automotive LED replacement bulb.',
        450.00,
        'PHP',
        35,
        TRUE
    ),
    (
        'AH-ELE-002',
        '12V Car Battery',
        '12v-car-battery',
        'Sample 12V automotive battery listing.',
        4200.00,
        'PHP',
        10,
        TRUE
    ),
    (
        'AH-SUS-001',
        'Shock Absorber',
        'shock-absorber',
        'Sample shock absorber listing. Verify vehicle fitment.',
        2800.00,
        'PHP',
        12,
        TRUE
    ),
    (
        'AH-FLT-001',
        'Engine Air Filter',
        'engine-air-filter',
        'Sample replacement engine air filter.',
        420.00,
        'PHP',
        45,
        TRUE
    ),
    (
        'AH-EXT-001',
        'Universal Mud Flaps',
        'universal-mud-flaps',
        'Sample automotive exterior accessory.',
        550.00,
        'PHP',
        25,
        TRUE
    ),
    (
        'AH-INT-001',
        'Car Floor Mat Set',
        'car-floor-mat-set',
        'Sample automotive floor mat set.',
        950.00,
        'PHP',
        18,
        TRUE
    ),
    (
        'AH-TOL-001',
        'Automotive Tool Kit',
        'automotive-tool-kit',
        'Sample basic automotive maintenance tool kit.',
        1500.00,
        'PHP',
        15,
        TRUE
    )
ON CONFLICT (sku)
DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    is_active = EXCLUDED.is_active,
    updated_at = now();