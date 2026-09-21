CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO roles (id, name, description) VALUES
    (1, 'Super Admin', 'Full system administration and authorization access'),
    (2, 'Store Manager', 'Store inventory and item issuance management access'),
    (3, 'Staff', 'Standard staff request and inventory access');
    
SELECT setval(
    'roles_id_seq',
    (SELECT MAX(id) FROM roles)
);


-- =========================================================
-- DEPARTMENTS
-- =========================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    role_id INTEGER NOT NULL,
    department_id UUID,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    phone_number VARCHAR(20),
    office_location VARCHAR(100),

    reset_otp VARCHAR(10),
    reset_otp_expires TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT fk_user_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL
);


-- =========================================================
-- CATEGORIES
-- =========================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- INVENTORY ITEMS
-- =========================================================

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID NOT NULL,

    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    unit VARCHAR(20) NOT NULL DEFAULT 'pcs',

    minimum_stock INTEGER NOT NULL DEFAULT 5,
    current_stock INTEGER NOT NULL DEFAULT 0,
    physical_stock INTEGER NOT NULL DEFAULT 0,

    is_asset BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id),

    CONSTRAINT chk_item_minimum_stock
        CHECK (minimum_stock >= 0),

    CONSTRAINT chk_item_current_stock
        CHECK (current_stock >= 0),

    CONSTRAINT chk_item_physical_stock
        CHECK (physical_stock >= 0),

    CONSTRAINT chk_item_stock_consistency
        CHECK (current_stock <= physical_stock)
);


-- =========================================================
-- ASSETS
-- For individually identifiable equipment.
-- Example: laptops, monitors, switches, projectors.
-- =========================================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    item_id UUID NOT NULL,

    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    serial_number VARCHAR(150) UNIQUE,

    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',

    current_custodian_id UUID,

    acquired_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_asset_item
        FOREIGN KEY (item_id)
        REFERENCES items(id),

    CONSTRAINT fk_asset_custodian
        FOREIGN KEY (current_custodian_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_asset_status
        CHECK (
            status IN (
                'AVAILABLE',
                'RESERVED',
                'ISSUED',
                'RETURNED',
                'DAMAGED',
                'RETIRED'
            )
        )
);


-- =========================================================
-- INVENTORY TRANSACTIONS
-- Permanent stock movement ledger.
-- =========================================================

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    item_id UUID NOT NULL,

    transaction_type VARCHAR(30) NOT NULL,
    quantity INTEGER NOT NULL,

    reference_no VARCHAR(100),
    remarks TEXT,

    performed_by UUID NOT NULL,

    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_item
        FOREIGN KEY (item_id)
        REFERENCES items(id),

    CONSTRAINT fk_transaction_user
        FOREIGN KEY (performed_by)
        REFERENCES users(id),

    CONSTRAINT chk_transaction_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_transaction_type
        CHECK (
            transaction_type IN (
                'RECEIPT',
                'RESERVATION',
                'ISSUE',
                'RETURN',
                'ADJUSTMENT_IN',
                'ADJUSTMENT_OUT',
                'WRITE_OFF'
            )
        )
);


-- =========================================================
-- REQUESTS
-- =========================================================

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requester_id UUID NOT NULL,
    department_id UUID NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    purpose TEXT NOT NULL,

    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    approved_by UUID,
    approved_at TIMESTAMP,

    rejection_reason TEXT,

    needed_by_date DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_request_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(id),

    CONSTRAINT fk_request_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id),

    CONSTRAINT fk_request_approver
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_request_priority
        CHECK (
            priority IN (
                'LOW',
                'NORMAL',
                'HIGH',
                'CRITICAL'
            )
        ),

    CONSTRAINT chk_request_status
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'PARTIALLY_APPROVED',
                'REJECTED',
                'FULFILLED',
                'CANCELLED'
            )
        )
);


-- =========================================================
-- REQUEST ITEMS
-- One request can contain multiple inventory items.
-- =========================================================

CREATE TABLE request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID NOT NULL,
    item_id UUID NOT NULL,

    quantity_requested INTEGER NOT NULL,
    quantity_approved INTEGER NOT NULL DEFAULT 0,
    quantity_issued INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_request_item_request
        FOREIGN KEY (request_id)
        REFERENCES requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_request_item_inventory
        FOREIGN KEY (item_id)
        REFERENCES items(id),

    CONSTRAINT chk_quantity_requested
        CHECK (quantity_requested > 0),

    CONSTRAINT chk_quantity_approved
        CHECK (
            quantity_approved >= 0
            AND quantity_approved <= quantity_requested
        ),
     CONSTRAINT chk_quantity_issued
        CHECK (
            quantity_issued >= 0
            AND quantity_issued <= quantity_approved
        ),    

    CONSTRAINT uq_request_item
        UNIQUE (request_id, item_id)
);


-- =========================================================
-- RESERVATIONS
-- Prevents approved requests from competing for the same
-- available stock.
-- =========================================================

CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID NOT NULL,
    request_item_id UUID NOT NULL,
    item_id UUID NOT NULL,

    quantity INTEGER NOT NULL,
    quantity_remaining INTEGER NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'RESERVED',

    reserved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP,

    CONSTRAINT fk_reservation_request
        FOREIGN KEY (request_id)
        REFERENCES requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reservation_request_item
        FOREIGN KEY (request_item_id)
        REFERENCES request_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reservation_item
        FOREIGN KEY (item_id)
        REFERENCES items(id),

    CONSTRAINT chk_reservation_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_reservation_quantity_remaining
        CHECK (
            quantity_remaining >= 0
            AND quantity_remaining <= quantity
        ),

    CONSTRAINT chk_reservation_status
        CHECK (
            status IN (
                'RESERVED',
                'FULFILLED',
                'RELEASED',
                'CANCELLED'
            )
        )
);


-- =========================================================
-- ISSUED ITEMS
-- =========================================================

CREATE TABLE issued_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID,
    request_item_id UUID,

    item_id UUID NOT NULL,

    issued_to UUID NOT NULL,
    issued_by UUID NOT NULL,

    quantity INTEGER NOT NULL,

    issued_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,

    returned BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_issued_request
        FOREIGN KEY (request_id)
        REFERENCES requests(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_issued_request_item
        FOREIGN KEY (request_item_id)
        REFERENCES request_items(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_issued_item
        FOREIGN KEY (item_id)
        REFERENCES items(id),

    CONSTRAINT fk_issued_to
        FOREIGN KEY (issued_to)
        REFERENCES users(id),

    CONSTRAINT fk_issued_by
        FOREIGN KEY (issued_by)
        REFERENCES users(id),

    CONSTRAINT chk_issued_quantity
        CHECK (quantity > 0)
);


-- =========================================================
-- ITEM RETURNS
-- =========================================================

CREATE TABLE item_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    issued_item_id UUID NOT NULL,

    quantity_returned INTEGER NOT NULL,

    return_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    condition_status VARCHAR(50),
    remarks TEXT,

    CONSTRAINT fk_return_issued_item
        FOREIGN KEY (issued_item_id)
        REFERENCES issued_items(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_quantity_returned
        CHECK (quantity_returned > 0)
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- ATTACHMENTS
-- =========================================================

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,

    uploaded_by UUID,

    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attachment_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID,

    action VARCHAR(100) NOT NULL,

    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,

    old_data JSONB,
    new_data JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_log_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_users_department
    ON users(department_id);

CREATE INDEX idx_users_role
    ON users(role_id);

CREATE INDEX idx_items_category
    ON items(category_id);

CREATE INDEX idx_inventory_transactions_item
    ON inventory_transactions(item_id);

CREATE INDEX idx_inventory_transactions_date
    ON inventory_transactions(transaction_date);

CREATE INDEX idx_requests_requester
    ON requests(requester_id);

CREATE INDEX idx_requests_department
    ON requests(department_id);

CREATE INDEX idx_requests_status
    ON requests(status);

CREATE INDEX idx_requests_priority
    ON requests(priority);

CREATE INDEX idx_requests_allocation_order
    ON requests(priority, requested_at);

CREATE INDEX idx_request_items_request
    ON request_items(request_id);

CREATE INDEX idx_request_items_item
    ON request_items(item_id);

CREATE INDEX idx_reservations_item_status
    ON inventory_reservations(item_id, status);

CREATE INDEX idx_issued_items_item
    ON issued_items(item_id);

CREATE INDEX idx_issued_items_user
    ON issued_items(issued_to);

CREATE INDEX idx_notifications_user
    ON notifications(user_id, is_read);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs(entity_name, entity_id);

CREATE INDEX idx_audit_logs_user
    ON audit_logs(user_id);