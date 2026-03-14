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
  updated_at DATETIME,
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
  capacity INTEGER DEFAULT 1000,
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
-- OPERATIONS (STRICT STATUS WORKFLOW)
--------------------------------------------------

CREATE TABLE operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_type TEXT CHECK(operation_type IN ('receipt','delivery','transfer','adjustment')),
  reference TEXT,
  supplier_id INTEGER,
  customer_id INTEGER,
  status TEXT CHECK(status IN ('draft','waiting','ready','done','cancelled')) DEFAULT 'draft',
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(location_id) REFERENCES locations(id)
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(location_id) REFERENCES locations(id)
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
-- INDEXES
--------------------------------------------------

CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_stock_product ON stock(product_id);
CREATE INDEX idx_stock_location ON stock(location_id);
CREATE INDEX idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_ledger_location ON stock_ledger(location_id);
CREATE INDEX idx_adjustments_product ON adjustments(product_id);

--------------------------------------------------
-- DEMO DATA
--------------------------------------------------

INSERT INTO users(name,email,password_hash,role) VALUES
('Admin User','admin@ims.com','123','admin'),
('Warehouse Staff','staff@ims.com','123','staff'),
('Inventory Manager','manager@ims.com','123','manager');

INSERT INTO categories(name,description) VALUES
('Raw Materials','Manufacturing materials'),
('Electronics','Electronic components'),
('Furniture','Office furniture');

INSERT INTO products(name,sku,category_id,unit_of_measure,reorder_level) VALUES
('Steel Rod','STL001',1,'kg',50),
('Aluminium Sheet','ALU001',1,'kg',40),
('Office Chair','CHR001',3,'unit',10),
('Laptop Battery','BAT001',2,'unit',20),
('Monitor','MON001',2,'unit',15);

INSERT INTO suppliers(name,contact,email) VALUES
('Steel Supplier Ltd','9876543210','steel@supplier.com'),
('ElectroWorld','9876543211','electro@supplier.com');

INSERT INTO customers(name,contact,email) VALUES
('ABC Manufacturing','9000000001','abc@client.com'),
('XYZ Retail','9000000002','xyz@client.com');

INSERT INTO warehouses(name,address) VALUES
('Main Warehouse','Industrial Area'),
('Production Warehouse','Factory Floor');

INSERT INTO locations(warehouse_id,name) VALUES
(1,'Receiving Area'),
(1,'Rack A'),
(1,'Rack B'),
(2,'Production Floor');

INSERT INTO stock(product_id,location_id,quantity) VALUES
(1,2,100),
(2,2,80),
(3,3,25),
(4,2,50),
(5,3,30);

INSERT INTO reorder_rules(product_id,min_qty,max_qty) VALUES
(1,50,200),
(2,40,150),
(3,10,50);

--------------------------------------------------
-- DEMO DATA: SUPPLIERS & CUSTOMERS (extra)
--------------------------------------------------

INSERT INTO suppliers(name,contact,email) VALUES
('Metal Works Co','9876500001','metal@works.com'),
('Global Parts Inc','9876500002','global@parts.com');

INSERT INTO customers(name,contact,email) VALUES
('Delta Corp','9000000003','delta@corp.com'),
('Omega Traders','9000000004','omega@traders.com');

--------------------------------------------------
-- TRIGGER: SKU VALIDATION
--------------------------------------------------

CREATE TRIGGER validate_sku
BEFORE INSERT ON products
WHEN LENGTH(NEW.sku) < 3
BEGIN
  SELECT RAISE(ABORT,'SKU must be at least 3 characters');
END;

--------------------------------------------------
-- TRIGGER: UPDATE PRODUCT TIMESTAMP
--------------------------------------------------

CREATE TRIGGER update_product_timestamp
AFTER UPDATE ON products
BEGIN
  UPDATE products
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

--------------------------------------------------
-- TRIGGER: ENSURE STOCK ROW EXISTS
--------------------------------------------------

CREATE TRIGGER ensure_stock_row
BEFORE INSERT ON stock_moves
BEGIN
  INSERT OR IGNORE INTO stock(product_id,location_id,quantity)
  VALUES(NEW.product_id, NEW.to_location, 0);

  INSERT OR IGNORE INTO stock(product_id,location_id,quantity)
  VALUES(NEW.product_id, NEW.from_location, 0);
END;

--------------------------------------------------
-- TRIGGER: RECEIPT
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
-- TRIGGER: DELIVERY
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
-- TRIGGER: TRANSFER
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

--------------------------------------------------
-- TRIGGER: PREVENT NEGATIVE STOCK
--------------------------------------------------

CREATE TRIGGER prevent_negative_stock
BEFORE UPDATE ON stock
WHEN NEW.quantity < 0
BEGIN
  SELECT RAISE(ABORT,'Stock cannot go negative');
END;

--------------------------------------------------
-- TRIGGER: PREVENT LOCATION OVERFLOW
--------------------------------------------------

CREATE TRIGGER prevent_overflow
BEFORE UPDATE ON stock
WHEN NEW.quantity >
  (SELECT capacity FROM locations WHERE id = NEW.location_id)
BEGIN
  SELECT RAISE(ABORT,'Location capacity exceeded');
END;

--------------------------------------------------
-- TRIGGER: AUTO STOCK LEDGER ON EVERY STOCK CHANGE
--------------------------------------------------

CREATE TRIGGER stock_ledger_log
AFTER UPDATE ON stock
BEGIN
  INSERT INTO stock_ledger(
    product_id,
    location_id,
    change_qty,
    balance_after,
    operation_type
  )
  VALUES(
    NEW.product_id,
    NEW.location_id,
    NEW.quantity - OLD.quantity,
    NEW.quantity,
    'auto_update'
  );
END;

--------------------------------------------------
-- TRIGGER: AUTO LEDGER ON ADJUSTMENT
--------------------------------------------------

CREATE TRIGGER adjustment_ledger_log
AFTER INSERT ON adjustments
BEGIN
  INSERT INTO stock_ledger(
    product_id,
    location_id,
    change_qty,
    balance_after,
    operation_type,
    reference_id
  )
  VALUES(
    NEW.product_id,
    NEW.location_id,
    NEW.difference,
    NEW.counted_qty,
    'adjustment',
    NEW.id
  );
END;

--------------------------------------------------
-- VIEW: LOW STOCK ALERT
--------------------------------------------------

CREATE VIEW low_stock_alert AS
SELECT
  p.name,
  p.sku,
  s.quantity,
  r.min_qty,
  r.max_qty,
  w.name AS warehouse,
  l.name AS location
FROM stock s
JOIN products p ON s.product_id = p.id
JOIN reorder_rules r ON p.id = r.product_id
JOIN locations l ON s.location_id = l.id
JOIN warehouses w ON l.warehouse_id = w.id
WHERE s.quantity < r.min_qty;

--------------------------------------------------
-- VIEW: INVENTORY REPORT
--------------------------------------------------

CREATE VIEW inventory_report AS
SELECT
  p.name AS product,
  p.sku,
  w.name AS warehouse,
  l.name AS location,
  s.quantity,
  p.reorder_level,
  CASE WHEN s.quantity < p.reorder_level THEN 'LOW' ELSE 'OK' END AS stock_status
FROM stock s
JOIN products p ON s.product_id = p.id
JOIN locations l ON s.location_id = l.id
JOIN warehouses w ON l.warehouse_id = w.id;

--------------------------------------------------
-- VIEW: PRODUCT MOVEMENT ANALYTICS
--------------------------------------------------

CREATE VIEW product_movement AS
SELECT
  p.name,
  SUM(sm.quantity) AS total_moved
FROM stock_moves sm
JOIN products p ON sm.product_id = p.id
GROUP BY p.name
ORDER BY total_moved DESC;

--------------------------------------------------
-- VIEW: TRANSFER HISTORY
--------------------------------------------------

CREATE VIEW transfer_history AS
SELECT
  p.name,
  l1.name AS from_location,
  l2.name AS to_location,
  sm.quantity
FROM stock_moves sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN locations l1 ON sm.from_location = l1.id
LEFT JOIN locations l2 ON sm.to_location = l2.id
WHERE sm.from_location IS NOT NULL
AND sm.to_location IS NOT NULL;

--------------------------------------------------
-- VIEW: STOCK LEDGER FULL VIEW
--------------------------------------------------

CREATE VIEW stock_ledger_view AS
SELECT
  sl.id,
  p.name AS product_name,
  p.sku,
  l.name AS location_name,
  w.name AS warehouse_name,
  sl.change_qty,
  sl.balance_after,
  sl.operation_type,
  sl.reference_id,
  sl.created_at
FROM stock_ledger sl
JOIN products p ON sl.product_id = p.id
JOIN locations l ON sl.location_id = l.id
JOIN warehouses w ON l.warehouse_id = w.id
ORDER BY sl.created_at DESC;

--------------------------------------------------
-- VIEW: ADJUSTMENT HISTORY
--------------------------------------------------

CREATE VIEW adjustment_history AS
SELECT
  a.id,
  p.name AS product_name,
  p.sku,
  l.name AS location_name,
  w.name AS warehouse_name,
  a.recorded_qty,
  a.counted_qty,
  a.difference,
  a.reason,
  a.created_at
FROM adjustments a
JOIN products p ON a.product_id = p.id
JOIN locations l ON a.location_id = l.id
JOIN warehouses w ON l.warehouse_id = w.id
ORDER BY a.created_at DESC;

--------------------------------------------------
-- TEST CASE 1 : PRODUCT RECEIPT (SUPPLIER → WAREHOUSE)
--------------------------------------------------

INSERT INTO operations(operation_type,reference,supplier_id,status)
VALUES ('receipt','PO1001',1,'done');

INSERT INTO stock_moves(operation_id,product_id,to_location,quantity)
VALUES (1,1,1,50);

--------------------------------------------------
-- TEST CASE 2 : PRODUCT DELIVERY (WAREHOUSE → CUSTOMER)
--------------------------------------------------

INSERT INTO operations(operation_type,reference,customer_id,status)
VALUES ('delivery','SO1001',1,'done');

INSERT INTO stock_moves(operation_id,product_id,from_location,quantity)
VALUES (2,1,2,20);

--------------------------------------------------
-- TEST CASE 3 : WAREHOUSE TRANSFER (LOCATION → LOCATION)
--------------------------------------------------

INSERT INTO operations(operation_type,reference,status)
VALUES ('transfer','TR1001','done');

INSERT INTO stock_moves(operation_id,product_id,from_location,to_location,quantity)
VALUES (3,1,2,3,10);

--------------------------------------------------
-- TEST CASE 4 : STOCK ADJUSTMENT
--------------------------------------------------

INSERT INTO operations(operation_type,reference,status)
VALUES ('adjustment','ADJ1001','done');

INSERT INTO adjustments(product_id,location_id,recorded_qty,counted_qty,difference,reason)
VALUES (2,2,80,75,-5,'Manual count - shrinkage detected');

UPDATE stock SET quantity = 75 WHERE product_id = 2 AND location_id = 2;

--------------------------------------------------
-- VERIFY DATA
--------------------------------------------------

SELECT 'Users' AS TableName; SELECT * FROM users;
SELECT 'Products' AS TableName; SELECT * FROM products;
SELECT 'Suppliers' AS TableName; SELECT * FROM suppliers;
SELECT 'Customers' AS TableName; SELECT * FROM customers;
SELECT 'Stock' AS TableName; SELECT * FROM stock;
SELECT 'Stock Ledger' AS TableName; SELECT * FROM stock_ledger;
SELECT 'Adjustments' AS TableName; SELECT * FROM adjustments;
SELECT 'Low Stock Alert' AS TableName; SELECT * FROM low_stock_alert;
SELECT 'Inventory Report' AS TableName; SELECT * FROM inventory_report;