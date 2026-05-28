-- =============================================================================
-- Vector+ Tutor Marketplace — Production PostgreSQL Schema
-- Target: PostgreSQL 15+
-- Conventions: UUID PKs, TIMESTAMPTZ (UTC storage), snake_case, soft deletes
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- exclusion constraints for overlaps (optional)

-- ---------------------------------------------------------------------------
-- ENUMs — stable domain values; alter via migrations with care
-- ---------------------------------------------------------------------------
CREATE TYPE account_status AS ENUM (
  'pending_verification',
  'active',
  'suspended',
  'deactivated'
);

CREATE TYPE user_role AS ENUM (
  'student',
  'tutor',
  'admin'
  -- Users may hold multiple roles via user_roles junction (see below)
);

CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

CREATE TYPE lesson_status AS ENUM (
  'pending_payment',   -- created, awaiting payment
  'scheduled',         -- paid / confirmed
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'disputed'
);

CREATE TYPE payment_status AS ENUM (
  'requires_payment_method',
  'requires_action',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
);

CREATE TYPE payment_provider AS ENUM (
  'stripe',
  'manual',
  'promo_credit'
);

CREATE TYPE conversation_type AS ENUM (
  'direct',
  'lesson'
);

CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'push'
);

CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'read'
);

CREATE TYPE report_status AS ENUM (
  'open',
  'under_review',
  'resolved',
  'dismissed'
);

CREATE TYPE report_target_type AS ENUM (
  'user',
  'tutor_profile',
  'review',
  'message',
  'lesson'
);

CREATE TYPE availability_rule_type AS ENUM (
  'recurring_weekly',
  'one_off',
  'blocked'
);

CREATE TYPE currency_code AS ENUM (
  'USD', 'EUR', 'GBP', 'KZT', 'RUB'
  -- extend via migration as marketplace grows
);

-- ---------------------------------------------------------------------------
-- Utility: updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- USERS — authentication & account shell (not tutor/student specifics)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             CITEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  account_status    account_status NOT NULL DEFAULT 'pending_verification',
  timezone          TEXT NOT NULL DEFAULT 'UTC'
    CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$|^UTC$'),
  locale            TEXT NOT NULL DEFAULT 'en'
    CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  last_login_at     TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_deleted_check CHECK (
    deleted_at IS NULL OR account_status IN ('deactivated', 'suspended')
  )
);

CREATE INDEX idx_users_account_status ON users (account_status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_users_active_email ON users (email)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Multiple roles per user (student + tutor on same account)
CREATE TABLE user_roles (
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role       user_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

CREATE INDEX idx_user_roles_role ON user_roles (role);

-- ---------------------------------------------------------------------------
-- PROFILES — split tutor / student for normalization & query performance
-- ---------------------------------------------------------------------------
CREATE TABLE student_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  learning_goals  TEXT,
  budget_min_cents INTEGER CHECK (budget_min_cents IS NULL OR budget_min_cents >= 0),
  budget_max_cents INTEGER CHECK (
    budget_max_cents IS NULL
    OR budget_max_cents >= COALESCE(budget_min_cents, 0)
  ),
  budget_currency currency_code NOT NULL DEFAULT 'USD',
  preferred_tutor_age_range TEXT,
  preferred_age_min SMALLINT CHECK (preferred_age_min IS NULL OR preferred_age_min >= 0),
  preferred_age_max SMALLINT CHECK (
    preferred_age_max IS NULL OR preferred_age_max >= COALESCE(preferred_age_min, 0)
  ),
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_profiles_user ON student_profiles (user_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE tutor_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL,
  headline              TEXT,
  bio                   TEXT NOT NULL,
  avatar_url            TEXT,
  video_intro_url       TEXT,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  verified_at           TIMESTAMPTZ,
  default_hourly_rate_cents INTEGER NOT NULL CHECK (default_hourly_rate_cents >= 0),
  default_currency      currency_code NOT NULL DEFAULT 'USD',
  min_lesson_minutes    SMALLINT NOT NULL DEFAULT 60
    CHECK (min_lesson_minutes IN (30, 45, 60, 90, 120)),
  max_lesson_minutes    SMALLINT NOT NULL DEFAULT 120
    CHECK (max_lesson_minutes >= min_lesson_minutes),
  -- Denormalized aggregates; maintained by triggers or async jobs
  rating_avg            NUMERIC(3, 2) NOT NULL DEFAULT 0
    CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count          INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  lessons_completed     INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
  response_time_minutes INTEGER,
  is_accepting_students BOOLEAN NOT NULL DEFAULT TRUE,
  workplace_type        TEXT,  -- remote, campus, etc. — or FK later
  search_document       TSVECTOR, -- maintained by trigger for FTS
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tutor_profiles_user ON tutor_profiles (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tutor_profiles_verification ON tutor_profiles (verification_status)
  WHERE deleted_at IS NULL AND is_accepting_students = TRUE;

CREATE INDEX idx_tutor_profiles_rating ON tutor_profiles (rating_avg DESC, rating_count DESC)
  WHERE deleted_at IS NULL AND verification_status = 'verified';

CREATE INDEX idx_tutor_profiles_search_gin ON tutor_profiles USING GIN (search_document);

CREATE INDEX idx_tutor_profiles_metadata_gin ON tutor_profiles USING GIN (metadata jsonb_path_ops);

CREATE TRIGGER trg_tutor_profiles_updated_at
  BEFORE UPDATE ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- SUBJECTS — hierarchical categories
-- ---------------------------------------------------------------------------
CREATE TABLE subject_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  parent_id   UUID REFERENCES subject_categories (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subject_categories_parent ON subject_categories (parent_id);

CREATE TRIGGER trg_subject_categories_updated_at
  BEFORE UPDATE ON subject_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES subject_categories (id) ON DELETE RESTRICT,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_category ON subjects (category_id, is_active);

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- TUTOR_SUBJECTS — M:N with per-subject pricing & experience
-- ---------------------------------------------------------------------------
CREATE TABLE tutor_subjects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id    UUID NOT NULL REFERENCES tutor_profiles (id) ON DELETE CASCADE,
  subject_id          UUID NOT NULL REFERENCES subjects (id) ON DELETE RESTRICT,
  hourly_rate_cents   INTEGER NOT NULL CHECK (hourly_rate_cents >= 0),
  currency            currency_code NOT NULL,
  experience_years    SMALLINT CHECK (experience_years IS NULL OR experience_years >= 0),
  proficiency_level   SMALLINT CHECK (proficiency_level IS NULL OR proficiency_level BETWEEN 1 AND 5),
  is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
  description         TEXT,
  search_document     TSVECTOR,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tutor_subjects_unique UNIQUE (tutor_profile_id, subject_id)
);

CREATE INDEX idx_tutor_subjects_tutor ON tutor_subjects (tutor_profile_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tutor_subjects_subject ON tutor_subjects (subject_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tutor_subjects_subject_rate ON tutor_subjects (subject_id, hourly_rate_cents)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tutor_subjects_search_gin ON tutor_subjects USING GIN (search_document);

-- Only one primary subject per tutor
CREATE UNIQUE INDEX idx_tutor_subjects_one_primary
  ON tutor_subjects (tutor_profile_id)
  WHERE is_primary = TRUE AND deleted_at IS NULL;

CREATE TRIGGER trg_tutor_subjects_updated_at
  BEFORE UPDATE ON tutor_subjects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Student interest tags (registration flow)
CREATE TABLE student_subject_interests (
  student_profile_id UUID NOT NULL REFERENCES student_profiles (id) ON DELETE CASCADE,
  subject_id         UUID NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_profile_id, subject_id)
);

-- ---------------------------------------------------------------------------
-- AVAILABILITY — recurring rules + concrete bookable slots
-- Timezone on rules; absolute instants stored as TIMESTAMPTZ (UTC)
-- ---------------------------------------------------------------------------
CREATE TABLE tutor_availability_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES tutor_profiles (id) ON DELETE CASCADE,
  rule_type        availability_rule_type NOT NULL DEFAULT 'recurring_weekly',
  timezone         TEXT NOT NULL
    CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$|^UTC$'),
  -- recurring: day 0=Sunday .. 6=Saturday (ISO: use 1-7 in app layer if preferred)
  day_of_week      SMALLINT CHECK (
    rule_type <> 'recurring_weekly' OR day_of_week BETWEEN 0 AND 6
  ),
  start_time       TIME,  -- local time in `timezone`
  end_time         TIME CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time),
  -- one_off / blocked: specific UTC window
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  valid_from       DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until      DATE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  external_sync_id TEXT,  -- Google/Outlook calendar event series id
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_availability_rules_tutor ON tutor_availability_rules (tutor_profile_id)
  WHERE deleted_at IS NULL AND is_active = TRUE;

CREATE INDEX idx_availability_rules_recurring
  ON tutor_availability_rules (tutor_profile_id, day_of_week)
  WHERE rule_type = 'recurring_weekly' AND deleted_at IS NULL AND is_active = TRUE;

-- Materialized bookable slots (generated by job or on-demand for next N days)
CREATE TABLE availability_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id UUID NOT NULL REFERENCES tutor_profiles (id) ON DELETE CASCADE,
  rule_id          UUID REFERENCES tutor_availability_rules (id) ON DELETE SET NULL,
  starts_at        TIMESTAMPTZ NOT NULL,
  ends_at          TIMESTAMPTZ NOT NULL,
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  hold_expires_at  TIMESTAMPTZ,  -- soft lock during checkout
  lesson_id        UUID,         -- FK added after lessons table
  version          INTEGER NOT NULL DEFAULT 1,  -- optimistic locking
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT availability_slots_time_check CHECK (ends_at > starts_at),
  CONSTRAINT availability_slots_hold_check CHECK (
    hold_expires_at IS NULL OR hold_expires_at > created_at
  )
);

CREATE INDEX idx_availability_slots_tutor_time
  ON availability_slots (tutor_profile_id, starts_at)
  WHERE is_available = TRUE;

CREATE INDEX idx_availability_slots_open
  ON availability_slots (starts_at, ends_at)
  WHERE is_available = TRUE AND lesson_id IS NULL;

-- Prevent double-booking overlapping slots for same tutor (requires btree_gist)
-- ALTER TABLE availability_slots ADD CONSTRAINT availability_slots_no_overlap
--   EXCLUDE USING gist (
--     tutor_profile_id WITH =,
--     tstzrange(starts_at, ends_at, '[)') WITH &&
--   ) WHERE (lesson_id IS NOT NULL OR is_available = FALSE);

CREATE TRIGGER trg_availability_slots_updated_at
  BEFORE UPDATE ON availability_slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- LESSONS — booking lifecycle
-- ---------------------------------------------------------------------------
CREATE TABLE lessons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id    UUID NOT NULL REFERENCES tutor_profiles (id) ON DELETE RESTRICT,
  student_profile_id  UUID NOT NULL REFERENCES student_profiles (id) ON DELETE RESTRICT,
  subject_id          UUID NOT NULL REFERENCES subjects (id) ON DELETE RESTRICT,
  tutor_subject_id    UUID REFERENCES tutor_subjects (id) ON DELETE SET NULL,
  availability_slot_id UUID UNIQUE REFERENCES availability_slots (id) ON DELETE SET NULL,
  status              lesson_status NOT NULL DEFAULT 'pending_payment',
  scheduled_start_at  TIMESTAMPTZ NOT NULL,
  scheduled_end_at    TIMESTAMPTZ NOT NULL,
  actual_start_at     TIMESTAMPTZ,
  actual_end_at       TIMESTAMPTZ,
  duration_minutes    SMALLINT NOT NULL CHECK (duration_minutes > 0),
  price_cents         INTEGER NOT NULL CHECK (price_cents >= 0),
  currency            currency_code NOT NULL,
  platform_fee_cents  INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  tutor_payout_cents  INTEGER NOT NULL DEFAULT 0 CHECK (tutor_payout_cents >= 0),
  meeting_url         TEXT,
  cancellation_reason TEXT,
  cancelled_by_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  cancelled_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT lessons_time_check CHECK (scheduled_end_at > scheduled_start_at),
  CONSTRAINT lessons_cancelled_check CHECK (
    (status <> 'cancelled' AND cancelled_at IS NULL)
    OR (status = 'cancelled' AND cancelled_at IS NOT NULL)
  ),
  CONSTRAINT lessons_completed_check CHECK (
    (status <> 'completed' AND completed_at IS NULL)
    OR (status = 'completed' AND completed_at IS NOT NULL)
  )
);

ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_lesson_fk
  FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE SET NULL;

CREATE INDEX idx_lessons_tutor_scheduled
  ON lessons (tutor_profile_id, scheduled_start_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_lessons_student_scheduled
  ON lessons (student_profile_id, scheduled_start_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_lessons_status_start
  ON lessons (status, scheduled_start_at)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_lessons_upcoming
  ON lessons (scheduled_start_at)
  WHERE status IN ('scheduled', 'in_progress') AND deleted_at IS NULL;

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- PAYMENTS — Stripe-ready
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id                UUID NOT NULL REFERENCES lessons (id) ON DELETE RESTRICT,
  payer_user_id            UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  provider                 payment_provider NOT NULL DEFAULT 'stripe',
  status                   payment_status NOT NULL DEFAULT 'requires_payment_method',
  amount_cents             INTEGER NOT NULL CHECK (amount_cents > 0),
  currency                 currency_code NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id         TEXT,
  stripe_customer_id       TEXT,
  idempotency_key          TEXT UNIQUE,
  paid_at                  TIMESTAMPTZ,
  failed_at                TIMESTAMPTZ,
  failure_code             TEXT,
  failure_message          TEXT,
  refunded_amount_cents    INTEGER NOT NULL DEFAULT 0
    CHECK (refunded_amount_cents >= 0 AND refunded_amount_cents <= amount_cents),
  refunded_at              TIMESTAMPTZ,
  metadata                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_lesson ON payments (lesson_id);
CREATE INDEX idx_payments_payer ON payments (payer_user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments (status) WHERE status IN ('processing', 'requires_action');
CREATE INDEX idx_payments_stripe_pi ON payments (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payment_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  provider        payment_provider NOT NULL,
  provider_event_id TEXT,
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payment_events_provider_unique UNIQUE (provider, provider_event_id)
);

CREATE INDEX idx_payment_events_payment ON payment_events (payment_id, processed_at DESC);

CREATE TABLE refunds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id            UUID NOT NULL REFERENCES payments (id) ON DELETE RESTRICT,
  amount_cents          INTEGER NOT NULL CHECK (amount_cents > 0),
  currency              currency_code NOT NULL,
  stripe_refund_id      TEXT UNIQUE,
  reason                TEXT,
  status                payment_status NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_payment ON refunds (payment_id);

CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- REVIEWS — one per completed lesson
-- ---------------------------------------------------------------------------
CREATE TABLE reviews (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id          UUID NOT NULL UNIQUE REFERENCES lessons (id) ON DELETE RESTRICT,
  tutor_profile_id   UUID NOT NULL REFERENCES tutor_profiles (id) ON DELETE RESTRICT,
  student_profile_id UUID NOT NULL REFERENCES student_profiles (id) ON DELETE RESTRICT,
  author_user_id     UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  rating             SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment            TEXT,
  is_public          BOOLEAN NOT NULL DEFAULT TRUE,
  moderated_at       TIMESTAMPTZ,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_author_is_student CHECK (author_user_id IS NOT NULL)
);

CREATE INDEX idx_reviews_tutor ON reviews (tutor_profile_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_public = TRUE;

CREATE INDEX idx_reviews_rating ON reviews (tutor_profile_id, rating)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enforce review only after lesson completed (trigger)
CREATE OR REPLACE FUNCTION enforce_review_on_completed_lesson()
RETURNS TRIGGER AS $$
DECLARE
  l_status lesson_status;
BEGIN
  SELECT status INTO l_status FROM lessons WHERE id = NEW.lesson_id;
  IF l_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Reviews allowed only for completed lessons';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_lesson_completed
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_on_completed_lesson();

-- ---------------------------------------------------------------------------
-- MESSAGING
-- ---------------------------------------------------------------------------
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        conversation_type NOT NULL DEFAULT 'direct',
  lesson_id   UUID UNIQUE REFERENCES lessons (id) ON DELETE SET NULL,
  subject     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_lesson ON conversations (lesson_id) WHERE lesson_id IS NOT NULL;

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at    TIMESTAMPTZ,
  muted_until     TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON conversation_participants (user_id, last_read_at);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  attachments     JSONB NOT NULL DEFAULT '[]'::jsonb,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  search_document TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_sent
  ON messages (conversation_id, sent_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_messages_sender ON messages (sender_id, sent_at DESC);

CREATE INDEX idx_messages_search_gin ON messages USING GIN (search_document);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  channel      notification_channel NOT NULL DEFAULT 'in_app',
  status       notification_status NOT NULL DEFAULT 'pending',
  type         TEXT NOT NULL,  -- e.g. lesson.reminder, payment.succeeded
  title        TEXT NOT NULL,
  body         TEXT,
  action_url   TEXT,
  data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at      TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX idx_notifications_user_feed
  ON notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_pending
  ON notifications (status, created_at)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- ADMIN / MODERATION
-- ---------------------------------------------------------------------------
CREATE TABLE admin_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  target_type     report_target_type NOT NULL,
  target_id       UUID NOT NULL,
  reason_code     TEXT NOT NULL,
  description     TEXT,
  status          report_status NOT NULL DEFAULT 'open',
  assigned_to     UUID REFERENCES users (id) ON DELETE SET NULL,
  resolution_note TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_reports_status ON admin_reports (status, created_at DESC);
CREATE INDEX idx_admin_reports_target ON admin_reports (target_type, target_id);

CREATE TRIGGER trg_admin_reports_updated_at
  BEFORE UPDATE ON admin_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- AUDIT LOG (append-only; partition in production)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  old_values    JSONB,
  new_values    JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);

-- ---------------------------------------------------------------------------
-- FTS trigger helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tutor_profiles_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_document :=
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.headline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tutor_profiles_search
  BEFORE INSERT OR UPDATE OF display_name, headline, bio ON tutor_profiles
  FOR EACH ROW EXECUTE FUNCTION tutor_profiles_search_update();

-- ---------------------------------------------------------------------------
-- Materialized view: tutor search catalog (refresh every 1-5 min or on event)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_tutor_search AS
SELECT
  tp.id AS tutor_profile_id,
  tp.user_id,
  tp.display_name,
  tp.headline,
  tp.rating_avg,
  tp.rating_count,
  tp.lessons_completed,
  tp.verification_status,
  tp.is_accepting_students,
  tp.default_hourly_rate_cents,
  tp.default_currency,
  COALESCE(MIN(ts.hourly_rate_cents), tp.default_hourly_rate_cents) AS min_rate_cents,
  COALESCE(MAX(ts.hourly_rate_cents), tp.default_hourly_rate_cents) AS max_rate_cents,
  ARRAY_AGG(DISTINCT ts.subject_id) FILTER (WHERE ts.deleted_at IS NULL) AS subject_ids,
  tp.search_document
FROM tutor_profiles tp
LEFT JOIN tutor_subjects ts ON ts.tutor_profile_id = tp.id AND ts.deleted_at IS NULL
WHERE tp.deleted_at IS NULL
  AND tp.verification_status = 'verified'
  AND tp.is_accepting_students = TRUE
GROUP BY tp.id;

CREATE UNIQUE INDEX idx_mv_tutor_search_pk ON mv_tutor_search (tutor_profile_id);
CREATE INDEX idx_mv_tutor_search_subjects ON mv_tutor_search USING GIN (subject_ids);
CREATE INDEX idx_mv_tutor_search_rating ON mv_tutor_search (rating_avg DESC, rating_count DESC);
CREATE INDEX idx_mv_tutor_search_rate ON mv_tutor_search (min_rate_cents, max_rate_cents);
CREATE INDEX idx_mv_tutor_search_fts ON mv_tutor_search USING GIN (search_document);

COMMIT;
