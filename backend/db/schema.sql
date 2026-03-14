PRAGMA foreign_keys = ON;

--------------------------------------------------
-- USERS TABLE
--------------------------------------------------

CREATE TABLE users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
email TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
role TEXT CHECK(role IN ('admin','manager','staff')),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------
-- CATEGORIES
--------------------------------------------------

CREATE TABLE categories (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
description TEXT
);

--------------------------------------------------
-- PRODUCTS
--------------------------------------------------

CREATE TABLE products (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
sku TEXT UNIQUE NOT NULL,
category_id INTEGER,
unit_of_measure TEXT,
reorder_level INTEGER DEFAULT 10,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(category_id) REFERENCES categories(id)
);

--------------------------------------------------
-- SUPPLIERS
--------------------------------------------------

CREATE TABLE suppliers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
contact TEXT,
email TEXT
);

--------------------------------------------------
-- CUSTOMERS
--------------------------------------------------

CREATE TABLE customers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
contact TEXT,
email TEXT
);

--------------------------------------------------
-- WAREHOUSES
--------------------------------------------------

CREATE TABLE warehouses (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
address TEXT
);

--------------------------------------------------
-- LOCATIONS
--------------------------------------------------

CREATE TABLE locations (
id INTEGER PRIMARY KEY AUTOINCREMENT,
warehouse_id INTEGER,
name TEXT NOT NULL,
FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

--------------------------------------------------
-- STOCK TABLE
--------------------------------------------------

CREATE TABLE stock (
id INTEGER PRIMARY KEY AUTOINCREMENT,
product_id INTEGER,
location_id INTEGER,
quantity INTEGER DEFAULT 0,
UNIQUE(product_id, location_id),
FOREIGN KEY(product_id) REFERENCES products(id),
FOREIGN KEY(location_id) REFERENCES locations(id)
);

--------------------------------------------------
-- OPERATIONS
--------------------------------------------------

CREATE TABLE operations (
id INTEGER PRIMARY KEY AUTOINCREMENT,
operation_type TEXT CHECK(operation_type IN ('receipt','delivery','transfer','adjustment')),
reference TEXT,
supplier_id INTEGER,
customer_id INTEGER,
status TEXT DEFAULT 'draft',
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
FOREIGN KEY(customer_id) REFERENCES customers(id)
);

--------------------------------------------------
-- STOCK MOVES
--------------------------------------------------

CREATE TABLE stock_moves (
id INTEGER PRIMARY KEY AUTOINCREMENT,
operation_id INTEGER,
product_id INTEGER,
from_location INTEGER,
to_location INTEGER,
quantity INTEGER,
FOREIGN KEY(operation_id) REFERENCES operations(id),
FOREIGN KEY(product_id) REFERENCES products(id),
FOREIGN KEY(from_location) REFERENCES locations(id),
FOREIGN KEY(to_location) REFERENCES locations(id)
);

--------------------------------------------------
-- STOCK LEDGER
--------------------------------------------------

CREATE TABLE stock_ledger (
id INTEGER PRIMARY KEY AUTOINCREMENT,
product_id INTEGER,
location_id INTEGER,
change_qty INTEGER,
balance_after INTEGER,
operation_type TEXT,
reference_id INTEGER,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------
-- ADJUSTMENTS
--------------------------------------------------

CREATE TABLE adjustments (
id INTEGER PRIMARY KEY AUTOINCREMENT,
product_id INTEGER,
location_id INTEGER,
recorded_qty INTEGER,
counted_qty INTEGER,
difference INTEGER,
reason TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------
-- REORDER RULES
--------------------------------------------------

CREATE TABLE reorder_rules (
id INTEGER PRIMARY KEY AUTOINCREMENT,
product_id INTEGER,
min_qty INTEGER,
max_qty INTEGER,
FOREIGN KEY(product_id) REFERENCES products(id)
);

--------------------------------------------------
-- INDEXES (PERFORMANCE)
--------------------------------------------------

CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_location ON stock(location_id);

--------------------------------------------------
-- DEMO DATA
--------------------------------------------------

INSERT INTO users(name,email,password_hash,role) VALUES
('Admin User','admin@ims.com','123','admin'),
('Warehouse Staff','staff@ims.com','123','staff'),
('Inventory Manager','manager@ims.com','123','manager');

SELECT * FROM users;

INSERT INTO categories(name,description) VALUES
('Raw Materials','Manufacturing materials'),
('Electronics','Electronic components'),
('Furniture','Office furniture');

SELECT * FROM categories;

INSERT INTO products(name,sku,category_id,unit_of_measure,reorder_level) VALUES
('Steel Rod','STL001',1,'kg',50),
('Aluminium Sheet','ALU001',1,'kg',40),
('Office Chair','CHR001',3,'unit',10),
('Laptop Battery','BAT001',2,'unit',20),
('Monitor','MON001',2,'unit',15);

SELECT * FROM products;

INSERT INTO suppliers(name,contact,email) VALUES
('Steel Supplier Ltd','9876543210','steel@supplier.com'),
('ElectroWorld','9876543211','electro@supplier.com');

SELECT * FROM suppliers;

INSERT INTO customers(name,contact,email) VALUES
('ABC Manufacturing','9000000001','abc@client.com'),
('XYZ Retail','9000000002','xyz@client.com');

SELECT * FROM customers;

INSERT INTO warehouses(name,address) VALUES
('Main Warehouse','Industrial Area'),
('Production Warehouse','Factory Floor');

SELECT * FROM warehouses;

INSERT INTO locations(warehouse_id,name) VALUES
(1,'Receiving Area'),
(1,'Rack A'),
(1,'Rack B'),
(2,'Production Floor');

SELECT * FROM locations;

INSERT INTO stock(product_id,location_id,quantity) VALUES
(1,2,100),
(2,2,80),
(3,3,25),
(4,2,50),
(5,3,30);

SELECT * FROM stock;

INSERT INTO reorder_rules(product_id,min_qty,max_qty) VALUES
(1,50,200),
(2,40,150),
(3,10,50);

SELECT * FROM reorder_rules;
--------------------------------------------------
-- TRIGGER: ENSURE STOCK ROW EXISTS
--------------------------------------------------

CREATE TRIGGER ensure_stock_row
BEFORE INSERT ON stock_moves
BEGIN
INSERT OR IGNORE INTO stock(product_id,location_id,quantity)
VALUES(NEW.product_id,NEW.to_location,0);

INSERT OR IGNORE INTO stock(product_id,location_id,quantity)
VALUES(NEW.product_id,NEW.from_location,0);
END;

--------------------------------------------------
-- TRIGGER: RECEIPT (INCREASE STOCK)
--------------------------------------------------

CREATE TRIGGER receipt_stock
AFTER INSERT ON stock_moves
WHEN NEW.from_location IS NULL
BEGIN
UPDATE stock
SET quantity = quantity + NEW.quantity
WHERE product_id = NEW.product_id
AND location_id = NEW.to_location;
END;

--------------------------------------------------
-- TRIGGER: DELIVERY (DECREASE STOCK)
--------------------------------------------------

CREATE TRIGGER delivery_stock
AFTER INSERT ON stock_moves
WHEN NEW.to_location IS NULL
BEGIN
UPDATE stock
SET quantity = quantity - NEW.quantity
WHERE product_id = NEW.product_id
AND location_id = NEW.from_location;
END;

--------------------------------------------------
-- TRIGGER: TRANSFER STOCK
--------------------------------------------------

CREATE TRIGGER transfer_stock
AFTER INSERT ON stock_moves
WHEN NEW.from_location IS NOT NULL
AND NEW.to_location IS NOT NULL
BEGIN

UPDATE stock
SET quantity = quantity - NEW.quantity
WHERE product_id = NEW.product_id
AND location_id = NEW.from_location;

UPDATE stock
SET quantity = quantity + NEW.quantity
WHERE product_id = NEW.product_id
AND location_id = NEW.to_location;

END;