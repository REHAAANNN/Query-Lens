-- ============================================================================
-- STEP 1: Create students table with realistic data
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INTEGER CHECK (age >= 16 AND age <= 80),
    major VARCHAR(100),
    gpa DECIMAL(3,2) CHECK (gpa >= 0 AND gpa <= 4.0),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_year INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert 5000 sample students with realistic distribution
INSERT INTO students (student_id, first_name, last_name, email, age, major, gpa, enrollment_date, graduation_year, is_active)
SELECT 
    'STU' || LPAD(i::TEXT, 6, '0'),
    (ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
           'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
           'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra'])[1 + MOD(i, 30)],
    (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
           'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
           'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'])[1 + MOD(i * 7, 30)],
    'student' || i || '@university.edu',
    18 + (RANDOM() * 12)::INTEGER, -- age 18-30
    (ARRAY['Computer Science', 'Business Administration', 'Engineering', 'Psychology', 'Biology', 
           'Mathematics', 'English Literature', 'Economics', 'Political Science', 'Chemistry',
           'Physics', 'History', 'Art', 'Music', 'Nursing', 'Education', 'Communications'])[1 + MOD(i, 17)],
    (2.0 + RANDOM() * 2.0)::DECIMAL(3,2), -- GPA 2.0-4.0
    CURRENT_DATE - (RANDOM() * 1460)::INTEGER, -- enrolled within last 4 years
    2024 + (RANDOM() * 4)::INTEGER, -- graduation 2024-2028
    RANDOM() > 0.1 -- 90% active
FROM generate_series(1, 5000) i
WHERE NOT EXISTS (SELECT 1 FROM students LIMIT 1);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_major ON students(major);
CREATE INDEX IF NOT EXISTS idx_students_gpa ON students(gpa);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);

-- ============================================================================
-- STEP 2: Update RPC functions to return real execution metrics
-- ============================================================================

-- Enhanced execute_dynamic_query with execution stats
DROP FUNCTION IF EXISTS execute_dynamic_query(TEXT);
CREATE OR REPLACE FUNCTION execute_dynamic_query(query_sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  exec_time NUMERIC;
BEGIN
  -- Only allow SELECT statements
  IF query_sql !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Capture start time
  start_time := clock_timestamp();
  
  -- Execute and return as JSON with metadata
  EXECUTE 'SELECT json_build_object(
    ''rows'', COALESCE(json_agg(row_to_json(t)), ''[]''::json),
    ''row_count'', COUNT(*)
  ) FROM (' || query_sql || ') t' INTO result;
  
  -- Capture end time and calculate execution time with microsecond precision
  end_time := clock_timestamp();
  exec_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000; -- Convert to milliseconds with decimal precision
  
  -- Add execution metadata
  result := result || json_build_object(
    'execution_time_ms', ROUND(exec_time::NUMERIC, 3), -- 3 decimal places (microsecond precision)
    'start_time', start_time,
    'end_time', end_time
  )::jsonb;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;

-- Enhanced EXPLAIN ANALYZE function that returns detailed metrics
DROP FUNCTION IF EXISTS execute_explain_analyze(TEXT);
CREATE OR REPLACE FUNCTION execute_explain_analyze(query_sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  explain_output JSONB;
  plan_node JSONB;
  exec_time NUMERIC;
  planning_time NUMERIC;
  total_cost NUMERIC;
  actual_rows BIGINT;
  shared_hit_blocks BIGINT;
  shared_read_blocks BIGINT;
BEGIN
  -- Only allow SELECT statements
  IF query_sql !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Get EXPLAIN ANALYZE with buffers
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || query_sql INTO explain_output;
  
  -- Extract the first plan node
  plan_node := explain_output->0->'Plan';
  
  -- Extract key metrics
  exec_time := (explain_output->0->>'Execution Time')::NUMERIC;
  planning_time := (explain_output->0->>'Planning Time')::NUMERIC;
  total_cost := (plan_node->>'Total Cost')::NUMERIC;
  actual_rows := (plan_node->>'Actual Rows')::BIGINT;
  
  -- Extract buffer statistics if available
  shared_hit_blocks := COALESCE((plan_node->>'Shared Hit Blocks')::BIGINT, 0);
  shared_read_blocks := COALESCE((plan_node->>'Shared Read Blocks')::BIGINT, 0);
  
  -- Build result with extracted metrics
  result := json_build_object(
    'execution_time_ms', exec_time,
    'planning_time_ms', planning_time,
    'total_cost', total_cost,
    'actual_rows', actual_rows,
    'shared_hit_blocks', shared_hit_blocks,
    'shared_read_blocks', shared_read_blocks,
    'full_plan', explain_output
  )::jsonb;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;

-- ============================================================================
-- STEP 3: Create courses and enrollments tables for JOIN examples
-- ============================================================================

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    credits INTEGER CHECK (credits >= 1 AND credits <= 6),
    instructor_name VARCHAR(100),
    max_capacity INTEGER,
    semester VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert 50 sample courses
INSERT INTO courses (course_code, course_name, department, credits, instructor_name, max_capacity, semester)
SELECT 
    dept_code || LPAD((ROW_NUMBER() OVER (PARTITION BY dept_code))::TEXT, 3, '0'),
    course_titles[1 + MOD(i, array_length(course_titles, 1))],
    dept_name,
    2 + (RANDOM() * 3)::INTEGER, -- 2-5 credits
    instructors[1 + MOD(i * 3, array_length(instructors, 1))],
    30 + (RANDOM() * 70)::INTEGER, -- 30-100 capacity
    semesters[1 + MOD(i, array_length(semesters, 1))]
FROM (
    SELECT 
        i,
        CASE 
            WHEN i <= 10 THEN 'Computer Science'
            WHEN i <= 18 THEN 'Engineering'
            WHEN i <= 25 THEN 'Mathematics'
            WHEN i <= 32 THEN 'Business Administration'
            WHEN i <= 38 THEN 'Psychology'
            ELSE 'Biology'
        END as dept_name,
        CASE 
            WHEN i <= 10 THEN 'CS'
            WHEN i <= 18 THEN 'ENG'
            WHEN i <= 25 THEN 'MATH'
            WHEN i <= 32 THEN 'BUS'
            WHEN i <= 38 THEN 'PSY'
            ELSE 'BIO'
        END as dept_code,
        ARRAY['Introduction to', 'Advanced', 'Fundamentals of', 'Applied', 'Theoretical', 'Practical'] as course_titles,
        ARRAY['Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown', 'Dr. Jones', 'Prof. Garcia', 'Dr. Miller', 'Prof. Davis'] as instructors,
        ARRAY['Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026'] as semesters
    FROM generate_series(1, 50) i
) sub
WHERE NOT EXISTS (SELECT 1 FROM courses LIMIT 1);

-- Create enrollments table (junction table)
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade VARCHAR(2),
    status VARCHAR(20) DEFAULT 'enrolled',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Insert realistic enrollments (each student enrolled in 3-6 courses)
INSERT INTO enrollments (student_id, course_id, enrollment_date, grade, status)
SELECT 
    s.id,
    c.id,
    CURRENT_DATE - (RANDOM() * 180)::INTEGER,
    CASE 
        WHEN RANDOM() > 0.2 THEN 
            CASE 
                WHEN RANDOM() > 0.7 THEN 'A'
                WHEN RANDOM() > 0.5 THEN 'B'
                WHEN RANDOM() > 0.3 THEN 'C'
                ELSE 'D'
            END
        ELSE NULL -- 20% haven't received grade yet
    END,
    CASE WHEN RANDOM() > 0.1 THEN 'enrolled' ELSE 'dropped' END
FROM 
    students s,
    courses c
WHERE 
    RANDOM() > 0.85 -- Each student gets ~15% of courses (7-8 courses out of 50)
    AND NOT EXISTS (SELECT 1 FROM enrollments LIMIT 1)
LIMIT 20000;

-- Create indexes for JOIN performance
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);

-- ============================================================================
-- STEP 4: Enable Row Level Security with development policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_alerts ENABLE ROW LEVEL SECURITY;

-- Create public policies for development (allow anon access)
DROP POLICY IF EXISTS "public_read_students" ON students;
CREATE POLICY "public_read_students" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_courses" ON courses;
CREATE POLICY "public_read_courses" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_enrollments" ON enrollments;
CREATE POLICY "public_read_enrollments" ON enrollments FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_logs" ON query_logs;
CREATE POLICY "public_insert_logs" ON query_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_logs" ON query_logs;
CREATE POLICY "public_read_logs" ON query_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_delete_logs" ON query_logs;
CREATE POLICY "public_delete_logs" ON query_logs FOR DELETE USING (true);

DROP POLICY IF EXISTS "public_insert_suggestions" ON optimization_suggestions;
CREATE POLICY "public_insert_suggestions" ON optimization_suggestions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_suggestions" ON optimization_suggestions;
CREATE POLICY "public_read_suggestions" ON optimization_suggestions FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_alerts" ON query_alerts;
CREATE POLICY "public_insert_alerts" ON query_alerts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_alerts" ON query_alerts;
CREATE POLICY "public_read_alerts" ON query_alerts FOR SELECT USING (true);

-- ============================================================================
-- VERIFICATION QUERIES (run these to test)
-- ============================================================================

-- Check students table
-- SELECT COUNT(*) FROM students;
-- SELECT major, COUNT(*), AVG(gpa)::DECIMAL(3,2) FROM students GROUP BY major ORDER BY COUNT(*) DESC;

-- Test queries to try in your app:
-- SELECT * FROM students WHERE gpa > 3.5 LIMIT 100;
-- SELECT * FROM students WHERE major = 'Computer Science' ORDER BY gpa DESC;
-- SELECT major, COUNT(*), AVG(gpa) FROM students GROUP BY major;
-- SELECT * FROM students WHERE enrollment_date > '2023-01-01' AND is_active = true;

-- JOIN query examples:
-- SELECT s.first_name, s.last_name, c.course_name, e.grade 
-- FROM students s 
-- JOIN enrollments e ON s.id = e.student_id 
-- JOIN courses c ON e.course_id = c.id 
-- WHERE s.major = 'Computer Science' LIMIT 100;

-- SELECT c.course_name, c.department, COUNT(e.id) as enrollment_count 
-- FROM courses c 
-- LEFT JOIN enrollments e ON c.id = e.course_id 
-- GROUP BY c.id, c.course_name, c.department 
-- ORDER BY enrollment_count DESC;

-- SELECT s.major, AVG(CASE e.grade 
--   WHEN 'A' THEN 4.0 WHEN 'B' THEN 3.0 WHEN 'C' THEN 2.0 WHEN 'D' THEN 1.0 
--   ELSE 0 END) as avg_course_grade
-- FROM students s
-- JOIN enrollments e ON s.id = e.student_id
-- WHERE e.grade IS NOT NULL
-- GROUP BY s.major
-- ORDER BY avg_course_grade DESC;

-- ============================================================================
-- UNDERSTANDING QUERY TIMING VARIATIONS (Real Database Behavior)
-- ============================================================================
-- The same query can take different times due to:
--
-- 1. BUFFER CACHE (Most Common Reason):
--    - Cold cache (first run): Data read from disk → SLOW (10-100ms)
--    - Warm cache (cached): Data in memory → FAST (0.5-5ms)
--    - To clear cache and force cold run (admin only):
--      -- SELECT pg_prewarm('students'); -- Warm up cache
--      -- DISCARD ALL; -- Clear session cache
--
-- 2. DATABASE LOAD:
--    - Other queries running simultaneously
--    - Shared infrastructure (Supabase free tier)
--    - Background maintenance (autovacuum, stats collector)
--
-- 3. QUERY PLANNER:
--    - May choose different execution plans
--    - Statistics updated between runs
--    - Index selection varies with data distribution
--
-- 4. DEMONSTRATION - Run this query 3 times and compare:
--    SELECT * FROM students WHERE major = 'Engineering' ORDER BY gpa DESC LIMIT 50;
--    First run: ~10-30ms (cold cache)
--    Second run: ~1-5ms (warm cache)
--    Third run: ~1-5ms (still warm)
--
-- 5. TO SEE CACHE EFFECT - Force different data access:
--    -- Run query 1: SELECT * FROM students WHERE major = 'Engineering' LIMIT 100;
--    -- Run query 2: SELECT * FROM students WHERE major = 'Psychology' LIMIT 100;
--    -- Run query 1 again: May be slower if Psychology data evicted Engineering from cache
