-- =============================================
-- AI4Business Database Schema
-- Run this in Supabase SQL Editor if re-creating
-- =============================================

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Investor' CHECK (role IN ('Admin', 'Manager', 'Investor', 'Startup_Manager', 'Business_Manager')),
  business_type text,
  full_name text,
  username text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles (lower(username));

-- 2. FINANCES TABLE
CREATE TABLE public.finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('Revenue', 'Expense', 'Profit')),
  category text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Success', 'Pending', 'Failed')),
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 3. INVENTORY TABLE
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 4. TASKS TABLE
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Completed')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- FINANCES
CREATE POLICY "Authenticated users can read finances" ON public.finances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert finances" ON public.finances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- INVENTORY
CREATE POLICY "Authenticated users can read inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can insert inventory" ON public.inventory FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
CREATE POLICY "Only admins can update inventory" ON public.inventory FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
CREATE POLICY "Only admins can delete inventory" ON public.inventory FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));

-- TASKS
CREATE POLICY "Managers can read own tasks" ON public.tasks FOR SELECT TO authenticated USING (manager_id = auth.uid());
CREATE POLICY "Managers can insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (manager_id = auth.uid());
CREATE POLICY "Managers can update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (manager_id = auth.uid()) WITH CHECK (manager_id = auth.uid());
CREATE POLICY "Managers can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (manager_id = auth.uid());

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, business_type)
  VALUES (NEW.id, 'Investor', NULL);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- NEW SYSTEM FRAMEWORK TABLES
-- =============================================

-- 5. STARTUPS TABLE
CREATE TABLE public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Fintech', 'Healthtech/Biotech', 'SaaS', 'EdTech', 'E-commerce/Marketplace', 'Cleantech/Climatech', 'FoodTech/AgriTech', 'HR Tech', 'Scalable Startups', 'Lifestyle Startups', 'Hybrid Models')),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  -- V2 Fields for Detailed Dashboard
  description text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  launch_date date,
  revenue numeric DEFAULT 0,
  contact_email text,
  contact_phone text
);

-- 6. STARTUP MEMBERS TABLE
CREATE TABLE public.startup_members (
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('Owner', 'Member', 'Worker')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (startup_id, user_id)
);

-- 7. BUSINESSES TABLE
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz DEFAULT now()
);

-- 8. INVESTMENTS TABLE
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 8.5 STARTUP SWIPES TABLE (BINDER)
CREATE TABLE public.startup_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('left', 'right')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(startup_id, investor_id)
);

-- 9. ADMIN NOTIFICATIONS
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read')),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- NEW TABLES ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view startups" ON public.startups FOR SELECT USING (true);
CREATE POLICY "Authenticated can create startups" ON public.startups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Startup creators can update startups" ON public.startups FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

ALTER TABLE public.startup_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view startup members" ON public.startup_members FOR SELECT USING (true);
CREATE POLICY "Authenticated can create startup members" ON public.startup_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own businesses and admins can view all" ON public.businesses FOR SELECT TO authenticated USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
CREATE POLICY "Users can create businesses" ON public.businesses FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update businesses" ON public.businesses FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors can view own investments" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = investor_id OR EXISTS (SELECT 1 FROM public.startups WHERE startups.id = startup_id AND startups.created_by = auth.uid()));
CREATE POLICY "Investors can insert investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = investor_id);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert notifications" ON public.admin_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
CREATE POLICY "Admins can update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));

-- =============================================
-- 10. SAVED STARTUPS (Favorites/Likes)
-- =============================================
CREATE TABLE public.saved_startups (
  investor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (investor_id, startup_id)
);

ALTER TABLE public.saved_startups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved startups" ON public.saved_startups FOR SELECT TO authenticated USING (auth.uid() = investor_id);
CREATE POLICY "Users can save startups" ON public.saved_startups FOR INSERT TO authenticated WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Users can unsave startups" ON public.saved_startups FOR DELETE TO authenticated USING (auth.uid() = investor_id);

-- =============================================
-- 11. TECH PARK APPLICATIONS
-- =============================================
CREATE TABLE public.tech_park_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Step 0: Applicant Type
  applicant_type text NOT NULL CHECK (applicant_type IN ('Individual', 'Legal Entity')),

  -- Applicant Information (Shared / Individual fields)
  full_name text NOT NULL, -- Serves as the first/last/patronymic for Individuals, or Full Legal Entity name for Legal Entities
  contact_phones text NOT NULL,
  email text NOT NULL,
  website text,
  
  -- Individual Specific
  id_series text,
  id_number text,
  issue_date date,
  issuing_authority text,
  tax_details text, -- Individual tax registration details
  
  -- Legal Entity Specific
  registration_number text,
  
  -- Authorized Representative (Legal Entity Only)
  rep_full_name text,
  rep_address text,
  rep_phone text,
  rep_email text,
  rep_id_details text,
  
  -- Activity details
  current_activity text NOT NULL,
  special_licenses jsonb, -- array of { name, issue_date, validity }
  
  -- Area Details
  total_area numeric,
  building_area numeric,
  office_area numeric,
  warehouse_area numeric,
  warehouse_volume numeric,
  auxiliary_area numeric,
  laboratory_area numeric,
  other_areas numeric,
  
  -- Project Details
  project_name text NOT NULL,
  project_details text NOT NULL,
  project_start_date date,
  project_duration text,
  new_jobs_created text,
  patent_info text,
  short_description text,
  
  -- Acceptance
  applicant_statement_name text, -- Mapped from the checkbox/acceptance view
  tech_park_name text,
  submission_date date,
  digital_signature text,
  
  -- System
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Under Review', 'Requires Revision')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tech_park_applications ENABLE ROW LEVEL SECURITY;

-- Insert logic covers both logged-in users and anonymous applicants (although tracking requires login)
CREATE POLICY "Public can insert applications" ON public.tech_park_applications FOR INSERT WITH CHECK (true);

-- User management
CREATE POLICY "Users can view own applications" ON public.tech_park_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.tech_park_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.tech_park_applications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admin management
CREATE POLICY "Admins can view all applications" ON public.tech_park_applications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
CREATE POLICY "Admins can update all applications" ON public.tech_park_applications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
CREATE POLICY "Admins can delete all applications" ON public.tech_park_applications FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
