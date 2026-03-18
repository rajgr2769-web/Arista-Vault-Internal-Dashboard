-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  department TEXT,
  reporting_officer UUID REFERENCES users(id),
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_employee UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  priority TEXT CHECK (priority IN ('Low', 'Medium', 'High')),
  deadline DATE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Done', 'Need Help')),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Leaves Table
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Denied')),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Messages Table (Manager ↔ Employee Chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Helper Function to Safely Get User Role
-- This function runs with elevated privileges to avoid RLS recursion.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Admins have full access to users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Managers can view employees they manage" ON users;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Managers can view employees they manage" ON users FOR SELECT USING (reporting_officer = auth.uid());
CREATE POLICY "Admins have full access to users" ON users FOR ALL USING (get_user_role() = 'admin');

-- RLS Policies for tasks
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update their own task status" ON tasks;
DROP POLICY IF EXISTS "Managers can manage tasks they assigned" ON tasks;
DROP POLICY IF EXISTS "Managers can view tasks they assigned" ON tasks;
CREATE POLICY "Employees can view their own tasks" ON tasks FOR SELECT USING (assigned_employee = auth.uid());
CREATE POLICY "Employees can update their own task status" ON tasks FOR UPDATE USING (assigned_employee = auth.uid());
CREATE POLICY "Managers can view tasks they assigned" ON tasks FOR SELECT USING (assigned_by = auth.uid());
CREATE POLICY "Managers can manage tasks they assigned" ON tasks FOR ALL USING (assigned_by = auth.uid());
CREATE POLICY "Admins can view all tasks" ON tasks FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admins can manage all tasks" ON tasks FOR ALL USING (get_user_role() = 'admin');

-- RLS Policies for announcements
DROP POLICY IF EXISTS "Everyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;
CREATE POLICY "Everyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (get_user_role() = 'admin');

-- RLS Policies for attendance
DROP POLICY IF EXISTS "Employees can view their own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
CREATE POLICY "Employees can view their own attendance" ON attendance FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Admins can view all attendance" ON attendance FOR ALL USING (get_user_role() = 'admin');

-- RLS Policies for Leaves Table
DROP POLICY IF EXISTS "Employees can manage their own leave requests" ON leaves;
DROP POLICY IF EXISTS "Users can view their own leave requests" ON leaves;
DROP POLICY IF EXISTS "Users can create their own leave requests" ON leaves;
DROP POLICY IF EXISTS "Users can update their pending leave requests" ON leaves;
DROP POLICY IF EXISTS "Managers can see leave requests of their reports" ON leaves;
DROP POLICY IF EXISTS "Managers can approve or deny leave requests of their reports" ON leaves;
DROP POLICY IF EXISTS "Admins can manage all leave requests" ON leaves;

CREATE POLICY "Users can view their own leave requests" ON leaves
FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Users can create their own leave requests" ON leaves
FOR INSERT
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update their pending leave requests" ON leaves
FOR UPDATE
USING (employee_id = auth.uid() AND status = 'Pending' AND approved_by IS NULL)
WITH CHECK (employee_id = auth.uid() AND status = 'Pending' AND approved_by IS NULL);

CREATE POLICY "Managers can see leave requests of their reports" ON leaves
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE id = leaves.employee_id
      AND reporting_officer = auth.uid()
      AND role = 'employee'
  )
);

CREATE POLICY "Managers can approve or deny leave requests of their reports" ON leaves
FOR UPDATE
USING (
  status = 'Pending'
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = leaves.employee_id
      AND reporting_officer = auth.uid()
      AND role = 'employee'
  )
)
WITH CHECK (
  approved_by = auth.uid()
  AND status IN ('Approved', 'Denied')
  AND EXISTS (
    SELECT 1
    FROM users
    WHERE id = leaves.employee_id
      AND reporting_officer = auth.uid()
      AND role = 'employee'
  )
);

CREATE POLICY "Admins can manage all leave requests" ON leaves
FOR ALL
USING (get_user_role() = 'admin');

-- RLS Policies for Messages Table
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;

CREATE POLICY "Users can view their own messages" ON messages
FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    get_user_role() = 'admin'
    OR (
      get_user_role() = 'manager'
      AND EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = receiver_id
          AND u.reporting_officer = auth.uid()
          AND u.role = 'employee'
      )
    )
    OR (
      get_user_role() = 'employee'
      AND EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = auth.uid()
          AND u.reporting_officer = receiver_id
      )
    )
  )
);

CREATE POLICY "Admins can manage all messages" ON messages
FOR ALL
USING (get_user_role() = 'admin');
