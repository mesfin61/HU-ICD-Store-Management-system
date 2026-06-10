CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT NOT NULL,
    department_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit VARCHAR(20) DEFAULT 'pcs',
    minimum_stock INT DEFAULT 5,
    current_stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_category
        FOREIGN KEY(category_id)
        REFERENCES categories(id)
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    item_id UUID NOT NULL,

    transaction_type VARCHAR(20) NOT NULL,

    quantity INT NOT NULL,

    reference_no VARCHAR(100),

    remarks TEXT,

    performed_by UUID NOT NULL,

    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_item
        FOREIGN KEY(item_id)
        REFERENCES items(id),

    CONSTRAINT fk_transaction_user
        FOREIGN KEY(performed_by)
        REFERENCES users(id)
);

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requester_id UUID NOT NULL,

    department_id UUID NOT NULL,

    status VARCHAR(20) DEFAULT 'PENDING',

    purpose TEXT,

    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    approved_by UUID,

    approved_at TIMESTAMP,

    rejection_reason TEXT,

    CONSTRAINT fk_request_user
        FOREIGN KEY(requester_id)
        REFERENCES users(id),

    CONSTRAINT fk_request_department
        FOREIGN KEY(department_id)
        REFERENCES departments(id)
);

CREATE TABLE request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID NOT NULL,

    item_id UUID NOT NULL,

    quantity_requested INT NOT NULL,

    quantity_approved INT DEFAULT 0,

    CONSTRAINT fk_request_item_request
        FOREIGN KEY(request_id)
        REFERENCES requests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_request_item_inventory
        FOREIGN KEY(item_id)
        REFERENCES items(id)
);

CREATE TABLE issued_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id UUID,

    item_id UUID NOT NULL,

    issued_to UUID NOT NULL,

    quantity INT NOT NULL,

    issued_by UUID NOT NULL,

    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    due_date DATE,

    returned BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_issued_item
        FOREIGN KEY(item_id)
        REFERENCES items(id)
);

CREATE TABLE item_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    issued_item_id UUID NOT NULL,

    quantity_returned INT NOT NULL,

    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    condition_status VARCHAR(50),

    remarks TEXT,

    CONSTRAINT fk_return_issue
        FOREIGN KEY(issued_item_id)
        REFERENCES issued_items(id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(255),

    message TEXT,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    file_name VARCHAR(255),

    file_path TEXT,

    uploaded_by UUID,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID,

    action VARCHAR(100),

    entity_name VARCHAR(100),

    entity_id UUID,

    old_data JSONB,

    new_data JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);