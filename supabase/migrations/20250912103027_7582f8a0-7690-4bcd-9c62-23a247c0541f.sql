-- Add versioning columns to policy_commissions table
ALTER TABLE policy_commissions
    ADD COLUMN version_no integer NOT NULL DEFAULT 1,
    ADD COLUMN valid_from timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN valid_to timestamptz,
    ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add unique constraint for policy commission versions
ALTER TABLE policy_commissions
    ADD CONSTRAINT uq_policy_commission_version UNIQUE (policy_id, version_no);

-- Add versioning columns to motor_payout_grid
ALTER TABLE motor_payout_grid
    ADD COLUMN version_no integer NOT NULL DEFAULT 1,
    ADD COLUMN valid_from timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN valid_to timestamptz,
    ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add versioning columns to health_payout_grid
ALTER TABLE health_payout_grid
    ADD COLUMN version_no integer NOT NULL DEFAULT 1,
    ADD COLUMN valid_from timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN valid_to timestamptz,
    ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Add versioning columns to life_payout_grid
ALTER TABLE life_payout_grid
    ADD COLUMN version_no integer NOT NULL DEFAULT 1,
    ADD COLUMN valid_from timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN valid_to timestamptz,
    ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create version-aware trigger function for policy commissions
CREATE OR REPLACE FUNCTION recalc_policy_commission()
RETURNS TRIGGER AS $$
DECLARE
    c record;
    commission_amount numeric(12,2);
    reward_amount numeric(12,2);
    total_amount numeric(12,2);
    last_version integer;
BEGIN
    -- Fetch commission details using existing function
    SELECT * INTO c FROM get_commission(NEW.id) LIMIT 1;

    IF c.policy_id IS NULL THEN
        RAISE NOTICE 'No commission found for policy %', NEW.id;
        RETURN NEW;
    END IF;

    commission_amount := (COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) * c.commission_rate / 100);
    reward_amount := (COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) * c.reward_rate / 100);
    total_amount := (COALESCE(NEW.premium_with_gst, NEW.premium_without_gst, 0) * c.total_rate / 100);

    IF TG_OP = 'INSERT' THEN
        -- First version always 1
        INSERT INTO policy_commissions (
            policy_id,
            org_id,
            version_no,
            product_type,
            grid_table,
            grid_id,
            commission_rate,
            reward_rate,
            total_rate,
            commission_amount,
            reward_amount,
            total_amount,
            payout_status,
            valid_from,
            is_active,
            created_by
        )
        VALUES (
            NEW.id,
            NEW.org_id,
            1,
            c.product_type,
            c.grid_table,
            c.grid_id,
            c.commission_rate,
            c.reward_rate,
            c.total_rate,
            commission_amount,
            reward_amount,
            total_amount,
            'pending',
            now(),
            true,
            NEW.created_by
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Close out old version
        UPDATE policy_commissions
        SET valid_to = now(),
            is_active = false
        WHERE policy_id = NEW.id
          AND is_active = true;

        -- Get last version number
        SELECT COALESCE(MAX(version_no), 0)
        INTO last_version
        FROM policy_commissions
        WHERE policy_id = NEW.id;

        -- Insert new version
        INSERT INTO policy_commissions (
            policy_id,
            org_id,
            version_no,
            product_type,
            grid_table,
            grid_id,
            commission_rate,
            reward_rate,
            total_rate,
            commission_amount,
            reward_amount,
            total_amount,
            payout_status,
            valid_from,
            is_active,
            created_by
        )
        VALUES (
            NEW.id,
            NEW.org_id,
            last_version + 1,
            c.product_type,
            c.grid_table,
            c.grid_id,
            c.commission_rate,
            c.reward_rate,
            c.total_rate,
            commission_amount,
            reward_amount,
            total_amount,
            'pending',
            now(),
            true,
            NEW.created_by
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create versioned update function for motor_payout_grid
CREATE OR REPLACE FUNCTION versioned_update_motor_grid()
RETURNS TRIGGER AS $$
DECLARE
    last_version integer;
BEGIN
    -- Close current active version
    UPDATE motor_payout_grid
    SET valid_to = now(),
        is_active = false
    WHERE id = OLD.id
      AND is_active = true;

    -- Get last version number for this grid configuration
    SELECT COALESCE(MAX(version_no), 0)
    INTO last_version
    FROM motor_payout_grid
    WHERE product_type = OLD.product_type
      AND product_subtype = OLD.product_subtype
      AND provider = OLD.provider
      AND COALESCE(vehicle_make, '') = COALESCE(OLD.vehicle_make, '')
      AND COALESCE(fuel_type_id, 0) = COALESCE(OLD.fuel_type_id, 0);

    -- Insert new version
    INSERT INTO motor_payout_grid (
        org_id,
        product_type,
        product_subtype,
        vehicle_type_id,
        business_type_id,
        fuel_type_id,
        rto_location,
        vehicle_make,
        gvw_range,
        cc_range,
        pcv_type,
        mcv_type,
        provider,
        ncb_percentage,
        coverage_type_id,
        gwp_slab,
        commission_rate,
        reward_rate,
        version_no,
        valid_from,
        is_active,
        created_by
    )
    VALUES (
        NEW.org_id,
        NEW.product_type,
        NEW.product_subtype,
        NEW.vehicle_type_id,
        NEW.business_type_id,
        NEW.fuel_type_id,
        NEW.rto_location,
        NEW.vehicle_make,
        NEW.gvw_range,
        NEW.cc_range,
        NEW.pcv_type,
        NEW.mcv_type,
        NEW.provider,
        NEW.ncb_percentage,
        NEW.coverage_type_id,
        NEW.gwp_slab,
        NEW.commission_rate,
        NEW.reward_rate,
        last_version + 1,
        now(),
        true,
        NEW.created_by
    );

    RETURN NULL; -- Prevent direct update
END;
$$ LANGUAGE plpgsql;

-- Create versioned update function for health_payout_grid
CREATE OR REPLACE FUNCTION versioned_update_health_grid()
RETURNS TRIGGER AS $$
DECLARE
    last_version integer;
BEGIN
    -- Close current active version
    UPDATE health_payout_grid
    SET valid_to = now(),
        is_active = false
    WHERE id = OLD.id
      AND is_active = true;

    -- Get last version number for this grid configuration
    SELECT COALESCE(MAX(version_no), 0)
    INTO last_version
    FROM health_payout_grid
    WHERE product_type = OLD.product_type
      AND product_sub_type = OLD.product_sub_type
      AND provider = OLD.provider
      AND plan_name = OLD.plan_name;

    -- Insert new version
    INSERT INTO health_payout_grid (
        org_id,
        product_type,
        product_sub_type,
        provider,
        plan_name,
        sum_insured_min,
        sum_insured_max,
        age_group,
        family_size,
        commission_rate,
        reward_rate,
        version_no,
        valid_from,
        is_active,
        created_by
    )
    VALUES (
        NEW.org_id,
        NEW.product_type,
        NEW.product_sub_type,
        NEW.provider,
        NEW.plan_name,
        NEW.sum_insured_min,
        NEW.sum_insured_max,
        NEW.age_group,
        NEW.family_size,
        NEW.commission_rate,
        NEW.reward_rate,
        last_version + 1,
        now(),
        true,
        NEW.created_by
    );

    RETURN NULL; -- Prevent direct update
END;
$$ LANGUAGE plpgsql;

-- Create versioned update function for life_payout_grid
CREATE OR REPLACE FUNCTION versioned_update_life_grid()
RETURNS TRIGGER AS $$
DECLARE
    last_version integer;
BEGIN
    -- Close current active version
    UPDATE life_payout_grid
    SET valid_to = now(),
        is_active = false
    WHERE id = OLD.id
      AND is_active = true;

    -- Get last version number for this grid configuration
    SELECT COALESCE(MAX(version_no), 0)
    INTO last_version
    FROM life_payout_grid
    WHERE product_type = OLD.product_type
      AND COALESCE(product_sub_type, '') = COALESCE(OLD.product_sub_type, '')
      AND provider = OLD.provider
      AND COALESCE(plan_name, '') = COALESCE(OLD.plan_name, '');

    -- Insert new version
    INSERT INTO life_payout_grid (
        org_id,
        product_type,
        product_sub_type,
        provider,
        plan_type,
        plan_name,
        ppt,
        pt,
        premium_start_price,
        premium_end_price,
        commission_rate,
        reward_rate,
        total_rate,
        commission_start_date,
        commission_end_date,
        variable_start_date,
        variable_end_date,
        version_no,
        valid_from,
        is_active,
        created_by
    )
    VALUES (
        NEW.org_id,
        NEW.product_type,
        NEW.product_sub_type,
        NEW.provider,
        NEW.plan_type,
        NEW.plan_name,
        NEW.ppt,
        NEW.pt,
        NEW.premium_start_price,
        NEW.premium_end_price,
        NEW.commission_rate,
        NEW.reward_rate,
        NEW.total_rate,
        NEW.commission_start_date,
        NEW.commission_end_date,
        NEW.variable_start_date,
        NEW.variable_end_date,
        last_version + 1,
        now(),
        true,
        NEW.created_by
    );

    RETURN NULL; -- Prevent direct update
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers and create new ones for policies
DROP TRIGGER IF EXISTS trg_policy_commission_insert ON policies;
CREATE TRIGGER trg_policy_commission_insert
AFTER INSERT ON policies
FOR EACH ROW
EXECUTE FUNCTION recalc_policy_commission();

DROP TRIGGER IF EXISTS trg_policy_commission_update ON policies;
CREATE TRIGGER trg_policy_commission_update
AFTER UPDATE OF premium_with_gst, premium_without_gst, provider, plan_name, product_type_id
ON policies
FOR EACH ROW
EXECUTE FUNCTION recalc_policy_commission();

-- Create versioned update triggers for payout grids
DROP TRIGGER IF EXISTS trg_version_motor_grid ON motor_payout_grid;
CREATE TRIGGER trg_version_motor_grid
INSTEAD OF UPDATE ON motor_payout_grid
FOR EACH ROW
EXECUTE FUNCTION versioned_update_motor_grid();

DROP TRIGGER IF EXISTS trg_version_health_grid ON health_payout_grid;
CREATE TRIGGER trg_version_health_grid
INSTEAD OF UPDATE ON health_payout_grid
FOR EACH ROW
EXECUTE FUNCTION versioned_update_health_grid();

DROP TRIGGER IF EXISTS trg_version_life_grid ON life_payout_grid;
CREATE TRIGGER trg_version_life_grid
INSTEAD OF UPDATE ON life_payout_grid
FOR EACH ROW
EXECUTE FUNCTION versioned_update_life_grid();