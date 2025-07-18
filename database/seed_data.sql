-- Insertar datos de prueba
INSERT INTO sucursales (nombre, direccion, telefono) VALUES
('Sucursal Centro', 'Av. 10 de Agosto 123, Quito', '02-234-5678'),
('Sucursal Norte', 'Av. 6 de Diciembre 456, Quito', '02-345-6789'),
('Sucursal Sur', 'Av. Maldonado 789, Quito', '02-456-7890');

INSERT INTO roles (nombre, permisos) VALUES
('admin', 'all'),
('manager', 'sales,inventory,reports'),
('cashier', 'sales,clients');

INSERT INTO usuarios (username, password_hash, rol_id, sucursal_id, nombre) VALUES
('admin', '$2b$10$rQZ5uJ5p.nZRRrpZzQXYqeJiJrXqZH2qUOKXw8mBfJ3RjN3qNQJ3q', 1, 1, 'Administrador'),
('manager1', '$2b$10$rQZ5uJ5p.nZRRrpZzQXYqeJiJrXqZH2qUOKXw8mBfJ3RjN3qNQJ3q', 2, 1, 'Gerente Centro'),
('cashier1', '$2b$10$rQZ5uJ5p.nZRRrpZzQXYqeJiJrXqZH2qUOKXw8mBfJ3RjN3qNQJ3q', 3, 1, 'Cajero Centro');

INSERT INTO categorias (nombre) VALUES
('Acción'),
('Aventura'),
('RPG'),
('Deportes'),
('Simulación'),
('Puzzle');

INSERT INTO plataformas (nombre) VALUES
('PlayStation 5'),
('Xbox Series X'),
('Nintendo Switch'),
('PC'),
('PlayStation 4'),
('Xbox One');

INSERT INTO desarrolladores (nombre) VALUES
('Sony Interactive Entertainment'),
('Microsoft Studios'),
('Nintendo'),
('Electronic Arts'),
('Ubisoft'),
('Activision Blizzard');

INSERT INTO distribuidores (nombre, telefono, email) VALUES
('Distribuidor GameTech', '02-111-2222', 'ventas@gametech.com'),
('Importadora Digital', '02-333-4444', 'pedidos@digital.com'),
('Comercial GameWorld', '02-555-6666', 'compras@gameworld.com');

INSERT INTO productos (codigo, nombre, categoria_id, desarrollador_id, precio) VALUES
('GOW001', 'God of War Ragnarök', 1, 1, 59.99),
('FIFA001', 'FIFA 23', 4, 4, 49.99),
('ZELDA001', 'The Legend of Zelda: Breath of the Wild', 2, 3, 54.99),
('HALO001', 'Halo Infinite', 1, 2, 49.99),
('MARIO001', 'Super Mario Odyssey', 2, 3, 49.99);

-- Asociar productos con plataformas
INSERT INTO productos_plataformas (producto_id, plataforma_id) VALUES
(1, 1), (1, 5), -- God of War en PS5 y PS4
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), -- FIFA en todas las plataformas
(3, 3), -- Zelda solo en Switch
(4, 2), (4, 6), (4, 4), -- Halo en Xbox y PC
(5, 3); -- Mario solo en Switch

-- Insertar inventario inicial
INSERT INTO inventario (producto_id, sucursal_id, plataforma_id, stock_actual, stock_minimo) VALUES
(1, 1, 1, 10, 5), -- God of War PS5 en Sucursal Centro
(1, 1, 5, 8, 3),  -- God of War PS4 en Sucursal Centro
(2, 1, 1, 15, 5), -- FIFA PS5 en Sucursal Centro
(2, 1, 2, 12, 5), -- FIFA Xbox Series X en Sucursal Centro
(3, 1, 3, 20, 8), -- Zelda Switch en Sucursal Centro
(4, 1, 2, 6, 3),  -- Halo Xbox Series X en Sucursal Centro
(5, 1, 3, 25, 10); -- Mario Switch en Sucursal Centro

INSERT INTO parametros_sistema (clave, valor, descripcion) VALUES
('iva_porcentaje', '12', 'Porcentaje de IVA aplicable'),
('moneda', 'USD', 'Moneda del sistema'),
('formato_fecha', 'DD/MM/YYYY', 'Formato de fecha para mostrar'),
('stock_minimo_global', '5', 'Stock mínimo por defecto para nuevos productos');