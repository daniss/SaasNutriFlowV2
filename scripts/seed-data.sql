-- This script adds comprehensive sample data for testing
-- Replace YOUR_USER_ID_HERE with your actual user ID from auth.users table

-- First, let's insert some sample clients
INSERT INTO clients (
    dietitian_id,
    name,
    email,
    phone,
    address,
    age,
    height,
    current_weight,
    goal_weight,
    goal,
    plan_type,
    status,
    tags,
    notes,
    emergency_contact,
    join_date,
    last_session,
    next_appointment,
    progress_percentage
) VALUES 
(
    'YOUR_USER_ID_HERE',
    'Sarah Johnson',
    'sarah.johnson@email.com',
    '(555) 123-4567',
    '123 Oak Street, Springfield, IL 62701',
    32,
    '5''6"',
    165.0,
    145.0,
    'Weight loss for wedding',
    'Premium',
    'Active',
    ARRAY['weight-loss', 'wedding', 'motivated'],
    'Getting married in 6 months. Very motivated and consistent with meal plans. Has been following vegetarian diet for 2 years.',
    'Mike Johnson (husband) - (555) 123-4568',
    '2024-11-15',
    '2024-12-20',
    '2024-12-29 14:00:00',
    65
),
(
    'YOUR_USER_ID_HERE',
    'Michael Chen',
    'm.chen@email.com',
    '(555) 234-5678',
    '456 Pine Avenue, Chicago, IL 60601',
    28,
    '5''10"',
    155.0,
    175.0,
    'Muscle gain and strength',
    'Athletic',
    'Active',
    ARRAY['muscle-gain', 'athlete', 'consistent'],
    'Marathon runner looking to build lean muscle mass while maintaining endurance. Works out 6 days a week.',
    'Lisa Chen (wife) - (555) 234-5679',
    '2024-10-20',
    '2024-12-18',
    '2024-12-30 10:00:00',
    78
),
(
    'YOUR_USER_ID_HERE',
    'Emma Davis',
    'emma.davis@email.com',
    '(555) 345-6789',
    '789 Maple Drive, Austin, TX 78701',
    45,
    '5''4"',
    180.0,
    160.0,
    'Diabetes management',
    'Medical',
    'Active',
    ARRAY['diabetes', 'medical', 'careful-monitoring'],
    'Type 2 diabetes diagnosed 2 years ago. Needs careful carb monitoring and regular check-ins. Very compliant with dietary restrictions.',
    'Robert Davis (husband) - (555) 345-6790',
    '2024-09-10',
    '2024-12-15',
    '2024-12-31 15:30:00',
    45
),
(
    'YOUR_USER_ID_HERE',
    'James Wilson',
    'james.wilson@email.com',
    '(555) 456-7890',
    '321 Cedar Lane, Denver, CO 80201',
    38,
    '6''1"',
    220.0,
    190.0,
    'Heart health improvement',
    'Medical',
    'Active',
    ARRAY['heart-health', 'medical', 'lifestyle-change'],
    'Recent heart health scare. Doctor recommended significant dietary changes. Very committed to making lifestyle changes.',
    'Jennifer Wilson (wife) - (555) 456-7891',
    '2024-11-01',
    '2024-12-22',
    '2025-01-02 11:00:00',
    52
),
(
    'YOUR_USER_ID_HERE',
    'Lisa Rodriguez',
    'lisa.rodriguez@email.com',
    '(555) 567-8901',
    '654 Birch Street, Miami, FL 33101',
    29,
    '5''7"',
    140.0,
    135.0,
    'Postpartum nutrition',
    'Specialized',
    'Active',
    ARRAY['postpartum', 'breastfeeding', 'energy'],
    'New mom (3 months postpartum) looking to regain energy and lose baby weight while breastfeeding. Needs nutrient-dense meals.',
    'Carlos Rodriguez (husband) - (555) 567-8902',
    '2024-12-01',
    '2024-12-19',
    '2025-01-03 09:30:00',
    30
),
(
    'YOUR_USER_ID_HERE',
    'David Thompson',
    'd.thompson@email.com',
    '(555) 678-9012',
    '987 Elm Court, Seattle, WA 98101',
    52,
    '5''9"',
    195.0,
    175.0,
    'General wellness',
    'Standard',
    'Active',
    ARRAY['wellness', 'maintenance', 'steady'],
    'Looking to establish better eating habits and maintain steady weight loss. Works long hours in tech industry.',
    'Susan Thompson (wife) - (555) 678-9013',
    '2024-08-15',
    '2024-12-10',
    '2025-01-05 16:00:00',
    85
),
(
    'YOUR_USER_ID_HERE',
    'Amanda Foster',
    'amanda.foster@email.com',
    '(555) 789-0123',
    '147 Willow Way, Portland, OR 97201',
    26,
    '5''5"',
    125.0,
    135.0,
    'Healthy weight gain',
    'Specialized',
    'Active',
    ARRAY['weight-gain', 'underweight', 'health'],
    'Naturally thin, looking to gain healthy weight and build better eating habits. Very active lifestyle with rock climbing.',
    'Mark Foster (brother) - (555) 789-0124',
    '2024-10-05',
    '2024-12-17',
    '2025-01-04 13:00:00',
    60
),
(
    'YOUR_USER_ID_HERE',
    'Robert Kim',
    'robert.kim@email.com',
    '(555) 890-1234',
    '258 Spruce Street, Boston, MA 02101',
    41,
    '5''8"',
    185.0,
    170.0,
    'Energy and focus',
    'Executive',
    'Active',
    ARRAY['executive', 'energy', 'busy-schedule'],
    'Busy executive looking to improve energy levels and mental clarity through better nutrition. Travels frequently for work.',
    'Grace Kim (wife) - (555) 890-1235',
    '2024-11-20',
    '2024-12-21',
    '2025-01-06 08:00:00',
    40
);

-- Add weight history for the first 3 clients to show progress tracking
INSERT INTO weight_history (client_id, weight, recorded_date, notes)
SELECT 
    c.id,
    c.current_weight + (15 - (series.week * 2)),
    CURRENT_DATE - INTERVAL '1 week' * (8 - series.week),
    CASE 
        WHEN series.week = 1 THEN 'Starting weight'
        WHEN series.week = 2 THEN 'Week 1 progress'
        WHEN series.week = 3 THEN 'Great improvement!'
        WHEN series.week = 4 THEN 'Steady progress'
        WHEN series.week = 5 THEN 'Halfway to goal'
        WHEN series.week = 6 THEN 'Excellent work'
        WHEN series.week = 7 THEN 'Almost there!'
        ELSE 'Current weight'
    END
FROM 
    (SELECT id, current_weight FROM clients WHERE dietitian_id = 'YOUR_USER_ID_HERE' LIMIT 3) c
CROSS JOIN 
    (SELECT generate_series(1, 8) AS week) series;

-- Add some sample meal plans
INSERT INTO meal_plans (
    client_id,
    dietitian_id,
    name,
    description,
    plan_content,
    calories_range,
    duration_days,
    status
)
SELECT 
    c.id,
    'YOUR_USER_ID_HERE',
    'Week ' || (ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY c.created_at)) || ' - ' || c.goal,
    'Customized meal plan for ' || c.name || ' focusing on ' || c.goal,
    jsonb_build_object(
        'meals', jsonb_build_array(
            jsonb_build_object(
                'day', 'Monday',
                'breakfast', 'Greek yogurt with berries and granola',
                'lunch', 'Quinoa salad with grilled chicken',
                'dinner', 'Baked salmon with roasted vegetables',
                'snacks', 'Apple with almond butter'
            ),
            jsonb_build_object(
                'day', 'Tuesday',
                'breakfast', 'Oatmeal with banana and nuts',
                'lunch', 'Turkey and avocado wrap',
                'dinner', 'Lean beef stir-fry with brown rice',
                'snacks', 'Greek yogurt with honey'
            )
        ),
        'notes', 'Follow portion guidelines and drink plenty of water'
    ),
    CASE 
        WHEN c.goal LIKE '%weight loss%' THEN '1400-1600'
        WHEN c.goal LIKE '%muscle%' THEN '2200-2500'
        WHEN c.goal LIKE '%diabetes%' THEN '1600-1800'
        ELSE '1800-2000'
    END,
    7,
    'Active'
FROM clients c 
WHERE c.dietitian_id = 'YOUR_USER_ID_HERE';

-- Add some sample reminders
INSERT INTO reminders (
    client_id,
    dietitian_id,
    type,
    title,
    message,
    scheduled_date,
    is_recurring,
    frequency,
    channels,
    status
)
SELECT 
    c.id,
    'YOUR_USER_ID_HERE',
    'check-in',
    'Weekly Check-in with ' || c.name,
    'Hi ' || c.name || '! Time for your weekly check-in. How are you feeling with your current meal plan?',
    CURRENT_DATE + INTERVAL '1 day' + (ROW_NUMBER() OVER (ORDER BY c.created_at) || ' hours')::INTERVAL,
    true,
    'weekly',
    ARRAY['email'],
    'Scheduled'
FROM clients c 
WHERE c.dietitian_id = 'YOUR_USER_ID_HERE'
LIMIT 4;

-- Add some sample invoices
INSERT INTO invoices (
    client_id,
    dietitian_id,
    invoice_number,
    service_description,
    amount,
    status,
    issue_date,
    due_date,
    payment_date
)
SELECT 
    c.id,
    'YOUR_USER_ID_HERE',
    'INV-' || LPAD((ROW_NUMBER() OVER (ORDER BY c.created_at))::TEXT, 3, '0'),
    CASE 
        WHEN c.plan_type = 'Premium' THEN 'Premium Consultation Package'
        WHEN c.plan_type = 'Medical' THEN 'Medical Nutrition Consultation'
        WHEN c.plan_type = 'Athletic' THEN 'Sports Nutrition Program'
        ELSE 'Standard Meal Planning Service'
    END,
    CASE 
        WHEN c.plan_type = 'Premium' THEN 450.00
        WHEN c.plan_type = 'Medical' THEN 350.00
        WHEN c.plan_type = 'Athletic' THEN 400.00
        ELSE 250.00
    END,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 3 = 0 THEN 'Paid'
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 3 = 1 THEN 'Pending'
        ELSE 'Sent'
    END,
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '15 days',
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY c.created_at) % 3 = 0 THEN CURRENT_DATE - INTERVAL '5 days'
        ELSE NULL
    END
FROM clients c 
WHERE c.dietitian_id = 'YOUR_USER_ID_HERE';

-- Add some sample appointments
INSERT INTO appointments (
    client_id,
    dietitian_id,
    title,
    description,
    appointment_date,
    duration_minutes,
    status,
    location
)
SELECT 
    c.id,
    'YOUR_USER_ID_HERE',
    'Consultation with ' || c.name,
    'Regular follow-up consultation to discuss progress and adjust meal plan as needed.',
    c.next_appointment,
    60,
    'Scheduled',
    'Office - Room 101'
FROM clients c 
WHERE c.dietitian_id = 'YOUR_USER_ID_HERE' 
AND c.next_appointment IS NOT NULL;

-- Add some sample messages
INSERT INTO messages (
    client_id,
    dietitian_id,
    sender_type,
    message,
    is_read,
    created_at
)
SELECT 
    c.id,
    'YOUR_USER_ID_HERE',
    CASE WHEN ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY c.created_at) % 2 = 0 THEN 'client' ELSE 'dietitian' END,
    CASE 
        WHEN ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY c.created_at) % 2 = 0
