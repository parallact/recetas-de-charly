-- ============================================
-- DATA MIGRATION FROM SUPABASE TO NEON
-- ============================================

-- Delete default categories (we'll insert from Supabase with their UUIDs)
DELETE FROM categories;

-- ============================================
-- USERS (from Supabase auth.users)
-- ============================================
INSERT INTO users (id, email, name, email_verified, created_at, updated_at) VALUES
  ('327ff2e9-f9bf-411a-aabd-bd517d3eb702', 'martinaduarte415@gmail.com', 'Martina', NULL, '2026-01-20 01:48:09.719731+00', '2026-01-20 01:48:09.719731+00'),
  ('7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', 'tomimartinez6666@gmail.com', 'Tomas Martinez', '2026-01-22 02:50:08.616433+00', '2026-01-22 02:49:53.129157+00', '2026-01-22 02:49:53.129157+00');

-- ============================================
-- PROFILES (from Supabase profiles)
-- ============================================
INSERT INTO profiles (id, username, display_name, avatar_url, bio, created_at, updated_at) VALUES
  ('327ff2e9-f9bf-411a-aabd-bd517d3eb702', NULL, 'martinaduarte415', NULL, NULL, '2026-01-20 01:48:09.718097+00', '2026-01-20 01:48:09.718097+00'),
  ('7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', NULL, 'tomimartinez6666', NULL, NULL, '2026-01-22 02:49:53.127477+00', '2026-01-22 02:49:53.127477+00');

-- ============================================
-- CATEGORIES (from Supabase - with original UUIDs)
-- ============================================
INSERT INTO categories (id, name, slug, description, icon, created_at) VALUES
  ('99caa761-dafc-4e12-8592-ed2142ae90f3', 'Desayunos', 'desayunos', NULL, '🍳', '2026-01-04 03:06:45.125447+00'),
  ('eebf78e3-5319-44b6-bb85-7d94bbeaa570', 'Almuerzos', 'almuerzos', NULL, '🍝', '2026-01-04 03:06:45.125447+00'),
  ('a7a729bd-8ff3-4e2b-9ce2-a22d17fa1cb8', 'Cenas', 'cenas', NULL, '🍽️', '2026-01-04 03:06:45.125447+00'),
  ('62057e9a-9d30-4e6c-8447-b6a79f0de7fa', 'Postres', 'postres', NULL, '🍰', '2026-01-04 03:06:45.125447+00'),
  ('da05c534-5966-4a90-a9fe-d4f87c7f20c2', 'Sopas', 'sopas', NULL, '🍲', '2026-01-04 03:06:45.125447+00'),
  ('2e7e35d0-0ffc-4b3c-a39a-4eba7d28235a', 'Ensaladas', 'ensaladas', NULL, '🥗', '2026-01-04 03:06:45.125447+00'),
  ('9837ba64-3ffb-4de5-987d-a3236d354402', 'Bebidas', 'bebidas', NULL, '🍹', '2026-01-04 03:06:45.125447+00'),
  ('2891c511-f265-4f23-bee4-fcf7eeab5bc4', 'Snacks', 'snacks', NULL, '🍿', '2026-01-04 03:06:45.125447+00'),
  ('544420de-36e3-4d60-8980-4a6420f6cd3f', 'Panaderia', 'panaderia', NULL, '🍞', '2026-01-04 03:06:45.125447+00'),
  ('a1da3208-1be3-4e20-a824-f7d77711f659', 'Mariscos', 'mariscos', NULL, '🦐', '2026-01-04 03:06:45.125447+00');

-- ============================================
-- RECIPES (from Supabase)
-- ============================================
INSERT INTO recipes (id, user_id, title, slug, description, image_url, source_url, cooking_time, prep_time, servings, difficulty, is_public, is_imported, imported_from, created_at, updated_at) VALUES
  ('5f1ec9a2-29f0-461e-83b5-16d2596b94cf', '7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', 'Pasta carbonara', 'pasta-carbonara', 'dada', 'https://jzqippyffpiielyqhyyg.supabase.co/storage/v1/object/public/recipe-images/7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d/1769051374980-rb75trl4da.JPG', NULL, 30, 30, 4, 'medium', true, false, NULL, '2026-01-22 03:10:31.83439+00', '2026-01-22 03:10:31.83439+00'),
  ('59b601a7-1ee4-42c5-9c2d-97bc197366ea', '7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', 'Tacos al Pastor', 'tacos-al-pastor', 'Tacos mexicanos tradicionales con carne de cerdo marinada en achiote, servidos con pina, cebolla y cilantro.', NULL, NULL, 45, 30, 6, 'medium', true, false, NULL, '2026-02-01 15:23:28.346419+00', '2026-02-01 15:23:28.346419+00'),
  ('9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', '7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', 'Pancakes Americanos', 'pancakes-americanos', 'Pancakes esponjosos y suaves, perfectos para un desayuno especial. Sirvelos con miel de maple y frutas.', NULL, NULL, 20, 10, 4, 'easy', true, false, NULL, '2026-02-01 15:23:43.464216+00', '2026-02-01 15:23:43.464216+00'),
  ('dd8160f9-be79-4ed4-80dc-0c72af019112', '7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', 'Ensalada Cesar', 'ensalada-cesar', 'La clasica ensalada Cesar con lechuga romana crujiente, crutones dorados y aderezo cremoso.', NULL, NULL, 15, 10, 4, 'easy', true, false, NULL, '2026-02-01 15:23:59.846071+00', '2026-02-01 15:23:59.846071+00'),
  ('6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', '7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', 'Brownie de Chocolate', 'brownie-de-chocolate', 'Brownies intensos y fudgy con el balance perfecto entre crujiente por fuera y suave por dentro.', NULL, NULL, 40, 15, 12, 'medium', true, false, NULL, '2026-02-01 15:24:12.721863+00', '2026-02-01 15:24:12.721863+00');

-- ============================================
-- INGREDIENTS (from Supabase - only valid ones)
-- ============================================
INSERT INTO ingredients (id, name, category, created_at) VALUES
  ('6aa6fc12-892b-466b-9515-a8fe9944ae21', 'queso', NULL, '2026-01-17 01:40:54.514522+00'),
  ('22447155-5edc-4602-b4c9-154859f71f62', 'sal', NULL, '2026-01-17 01:40:53.886864+00'),
  ('67e998a2-96da-456f-895d-8c92d398ea0c', 'peperoni', NULL, '2026-01-22 03:10:31.83439+00'),
  ('9daebd90-3520-454a-b980-21ff2e7a068c', 'Spaghetti', NULL, '2026-02-01 15:22:36.921637+00'),
  ('4f06f0eb-b20a-4b48-8ab9-77191c37b9ff', 'Huevos', NULL, '2026-02-01 15:22:36.921637+00'),
  ('cd662139-52ed-41f8-b1e2-7d7db127d2a5', 'Panceta', NULL, '2026-02-01 15:22:36.921637+00'),
  ('549f4289-87ee-43b3-a6a9-2cafe8e8cc94', 'Queso parmesano', NULL, '2026-02-01 15:22:36.921637+00'),
  ('134cc495-7c4e-440d-854e-2a870b84f8e1', 'Pimienta negra', NULL, '2026-02-01 15:22:36.921637+00'),
  ('d261695e-b9e9-41f6-83d7-7ab7bb406c50', 'Sal', NULL, '2026-02-01 15:22:36.921637+00'),
  ('0eaf14e5-e733-4237-951f-fc3e05175694', 'Carne de cerdo', NULL, '2026-02-01 15:22:36.921637+00'),
  ('3f9349d3-5d93-4173-9d73-16e445b4627a', 'Pina', NULL, '2026-02-01 15:22:36.921637+00'),
  ('0cdb47c4-84da-47e3-811e-e63dc911ad38', 'Cebolla', NULL, '2026-02-01 15:22:36.921637+00'),
  ('609ec392-90c0-4e3a-9ceb-011ecc0f6f62', 'Cilantro', NULL, '2026-02-01 15:22:36.921637+00'),
  ('dc0b73f8-c81d-4f23-b0d4-90336e54c636', 'Tortillas de maiz', NULL, '2026-02-01 15:22:36.921637+00'),
  ('aa2f42f8-dc49-4b0b-9aac-bdf252696c55', 'Achiote', NULL, '2026-02-01 15:22:36.921637+00'),
  ('01d65117-6b88-4681-9b82-a01fb902e8ed', 'Harina', NULL, '2026-02-01 15:22:36.921637+00'),
  ('17b74c1d-fe43-4a20-92b7-a557aef5a2ac', 'Leche', NULL, '2026-02-01 15:22:36.921637+00'),
  ('e8ff307d-1d05-4612-a95e-a4c061a5d2c2', 'Mantequilla', NULL, '2026-02-01 15:22:36.921637+00'),
  ('a03fe83b-3fd7-42c7-af50-ede1d9a250cc', 'Azucar', NULL, '2026-02-01 15:22:36.921637+00'),
  ('b663dcb3-4318-4b4a-b90d-a40c955d6627', 'Polvo de hornear', NULL, '2026-02-01 15:22:36.921637+00'),
  ('96d6a26d-d457-4a3b-a88e-48b80616921c', 'Lechuga romana', NULL, '2026-02-01 15:22:36.921637+00'),
  ('f33e05c4-6c2f-4c6d-9179-6f3b337a41ce', 'Crutones', NULL, '2026-02-01 15:22:36.921637+00'),
  ('18e47815-2531-4919-8310-91d748030764', 'Aderezo cesar', NULL, '2026-02-01 15:22:36.921637+00'),
  ('d0d3114a-59d4-40ea-8a6e-a08937dc72a6', 'Limon', NULL, '2026-02-01 15:22:36.921637+00'),
  ('28efc9d0-e5e9-4c7b-bb7d-d53858c5ee4f', 'Chocolate semi-amargo', NULL, '2026-02-01 15:22:36.921637+00'),
  ('1ffa8c9a-61f8-4295-a5fe-892027669d08', 'Extracto de vainilla', NULL, '2026-02-01 15:22:36.921637+00');

-- ============================================
-- RECIPE INGREDIENTS (from Supabase)
-- ============================================
INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, notes, order_index) VALUES
  ('6cb958af-53cb-4799-b649-74f776491619', '5f1ec9a2-29f0-461e-83b5-16d2596b94cf', '22447155-5edc-4602-b4c9-154859f71f62', 100, 'kg', NULL, 0),
  ('3b68422c-a052-49cd-ad7b-b644ce217161', '5f1ec9a2-29f0-461e-83b5-16d2596b94cf', '67e998a2-96da-456f-895d-8c92d398ea0c', 2, 'cucharada', NULL, 1),
  ('552887ee-6db7-4f66-92e2-7dbefbd6ba54', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', '0eaf14e5-e733-4237-951f-fc3e05175694', 1000, 'g', NULL, 0),
  ('11ce21b9-4c29-460b-bc23-f1dd28a0a95f', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 'aa2f42f8-dc49-4b0b-9aac-bdf252696c55', 100, 'g', NULL, 1),
  ('ff77a439-7f7c-4e6c-b787-ed7351559bb9', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', '3f9349d3-5d93-4173-9d73-16e445b4627a', 1, 'unidad', NULL, 2),
  ('629bd94d-3c1c-4fc9-b0da-0d33863e8fbb', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', '0cdb47c4-84da-47e3-811e-e63dc911ad38', 1, 'unidad', NULL, 3),
  ('080dc84e-f1ae-4c7f-b3fd-c999726eec7b', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', '609ec392-90c0-4e3a-9ceb-011ecc0f6f62', 1, 'taza', NULL, 4),
  ('69b7c79d-3ff1-4483-ad58-899f21edd410', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 'dc0b73f8-c81d-4f23-b0d4-90336e54c636', 12, 'unidad', NULL, 5),
  ('4f2d26ee-dc3e-467e-a98c-d89637d77992', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 'd0d3114a-59d4-40ea-8a6e-a08937dc72a6', 4, 'unidad', NULL, 6),
  ('917f4602-584e-4979-848e-d710d878e4cf', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 'd261695e-b9e9-41f6-83d7-7ab7bb406c50', 1, 'al gusto', NULL, 7),
  ('bb8236d8-a780-4edb-9757-61aef1560c20', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', '01d65117-6b88-4681-9b82-a01fb902e8ed', 200, 'g', NULL, 0),
  ('ff47c6ec-b03d-4052-8c40-a4222a407a2d', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', '4f06f0eb-b20a-4b48-8ab9-77191c37b9ff', 2, 'unidad', NULL, 1),
  ('0baf940f-9f3f-46fb-8dd3-08e400c9c089', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', '17b74c1d-fe43-4a20-92b7-a557aef5a2ac', 250, 'ml', NULL, 2),
  ('6714fc3c-a04b-4e51-93e1-4b9088bb820e', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 'e8ff307d-1d05-4612-a95e-a4c061a5d2c2', 50, 'g', NULL, 3),
  ('1f5dd941-951d-47d0-a91d-dde27385990a', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 'a03fe83b-3fd7-42c7-af50-ede1d9a250cc', 2, 'cucharada', NULL, 4),
  ('be78a272-a9c5-4ce0-b7ff-9780c7dcfd98', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 'b663dcb3-4318-4b4a-b90d-a40c955d6627', 2, 'cucharadita', NULL, 5),
  ('67ec0202-0396-4cb3-8e80-8ea0cd169b4e', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 'd261695e-b9e9-41f6-83d7-7ab7bb406c50', 1, 'pizca', NULL, 6),
  ('0e11e89a-6bef-4aa0-bbff-7418f59974b4', 'dd8160f9-be79-4ed4-80dc-0c72af019112', '96d6a26d-d457-4a3b-a88e-48b80616921c', 2, 'unidad', NULL, 0),
  ('652012b1-3690-4a18-8204-e7897b37cd13', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 'f33e05c4-6c2f-4c6d-9179-6f3b337a41ce', 1, 'taza', NULL, 1),
  ('f89ea131-d424-4b3d-9261-a5912d7cb4a9', 'dd8160f9-be79-4ed4-80dc-0c72af019112', '549f4289-87ee-43b3-a6a9-2cafe8e8cc94', 50, 'g', NULL, 2),
  ('d51fd134-b959-401b-8987-d369fee0ca5c', 'dd8160f9-be79-4ed4-80dc-0c72af019112', '18e47815-2531-4919-8310-91d748030764', 120, 'ml', NULL, 3),
  ('1a05f407-7939-4713-ad74-304017fb1dac', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 'd0d3114a-59d4-40ea-8a6e-a08937dc72a6', 1, 'unidad', NULL, 4),
  ('05aee956-3276-456f-b2df-a86391368e4a', 'dd8160f9-be79-4ed4-80dc-0c72af019112', '134cc495-7c4e-440d-854e-2a870b84f8e1', 1, 'al gusto', NULL, 5),
  ('87bf83c2-5cfa-48a0-8dec-f225585e002f', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', '28efc9d0-e5e9-4c7b-bb7d-d53858c5ee4f', 200, 'g', NULL, 0),
  ('e2d18307-77c2-4ec4-9373-c651da5d0cc0', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 'e8ff307d-1d05-4612-a95e-a4c061a5d2c2', 150, 'g', NULL, 1),
  ('b00f2066-1366-42f8-905e-c45cd23c7c01', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 'a03fe83b-3fd7-42c7-af50-ede1d9a250cc', 200, 'g', NULL, 2),
  ('a63ad29c-612c-491f-924c-e1e96ecd1aac', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', '4f06f0eb-b20a-4b48-8ab9-77191c37b9ff', 3, 'unidad', NULL, 3),
  ('3197bc31-ede5-432c-b84f-bd6fecf3dbc0', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', '01d65117-6b88-4681-9b82-a01fb902e8ed', 100, 'g', NULL, 4),
  ('46d7e543-d6aa-4128-8e7a-1ffc0e3b876c', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', '1ffa8c9a-61f8-4295-a5fe-892027669d08', 1, 'cucharadita', NULL, 5),
  ('92937911-3dc4-4639-a1c8-9f7f30b23c81', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 'd261695e-b9e9-41f6-83d7-7ab7bb406c50', 1, 'pizca', NULL, 6);

-- ============================================
-- INSTRUCTIONS (from Supabase)
-- ============================================
INSERT INTO instructions (id, recipe_id, step_number, content, image_url) VALUES
  ('6a897ad6-ccb6-47fc-93c1-3c537f8101fa', '5f1ec9a2-29f0-461e-83b5-16d2596b94cf', 1, 'pepitodddd', NULL),
  ('cf298c78-7f26-4f05-b34e-8da448ea4506', '5f1ec9a2-29f0-461e-83b5-16d2596b94cf', 2, 'pepedddddd', NULL),
  ('0403d597-460f-4b31-b35b-9c8d15c41145', '5f1ec9a2-29f0-461e-83b5-16d2596b94cf', 3, 'papuchoddd', NULL),
  ('03cee0c7-b50a-472f-bf55-cc6b99483c23', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 1, 'Corta la carne de cerdo en filetes delgados.', NULL),
  ('1be176ec-505e-4d3e-a0de-cead24c8f320', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 2, 'Disuelve el achiote en un poco de vinagre y jugo de naranja para hacer la marinada.', NULL),
  ('efb34f5b-91da-43a7-a829-b3b379c27453', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 3, 'Marina la carne por al menos 2 horas (mejor toda la noche).', NULL),
  ('25a887f4-285a-44c2-8e41-8089a6428888', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 4, 'Cocina la carne en una sarten caliente hasta que este dorada y cocida.', NULL),
  ('d0a7d46f-a95b-4aff-8e45-a278502a877d', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 5, 'Corta la carne en trozos pequenos.', NULL),
  ('2b17fcf2-0209-469c-a2d3-ae3ba7018006', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 6, 'Pica la cebolla y el cilantro finamente.', NULL),
  ('09cf6422-2369-4331-822a-ac6921924d5a', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 7, 'Corta la pina en cubos pequenos y dorala ligeramente en la sarten.', NULL),
  ('351a3948-e190-443d-aec6-223604dd92e2', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 8, 'Calienta las tortillas y arma los tacos con la carne, pina, cebolla y cilantro.', NULL),
  ('026734ca-023d-4abc-a3eb-72ca2298170f', '59b601a7-1ee4-42c5-9c2d-97bc197366ea', 9, 'Sirve con limon y salsa al gusto.', NULL),
  ('fa6c68fc-3a01-40e6-a8b4-26221acf3f2f', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 1, 'En un bowl grande, mezcla la harina, azucar, polvo de hornear y sal.', NULL),
  ('7de381d1-fb8e-49c8-9b96-0d043d2d5db1', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 2, 'En otro bowl, bate los huevos con la leche y la mantequilla derretida.', NULL),
  ('8b4a5a4d-cdec-4f44-b8b7-781f010e9c97', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 3, 'Vierte los ingredientes liquidos sobre los secos y mezcla hasta combinar.', NULL),
  ('b6527cd1-07ce-4efe-96e0-9b4a0f5053c1', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 4, 'Calienta una sarten a fuego medio y engrasala ligeramente.', NULL),
  ('d63d3f13-d09d-4ee6-a273-46a1c0db26bb', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 5, 'Vierte aproximadamente 1/4 taza de masa por pancake.', NULL),
  ('8b1fe1ae-62c0-4324-acb3-d1b81cd3aedd', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 6, 'Cocina hasta que aparezcan burbujas en la superficie, luego voltea.', NULL),
  ('2cd6de6a-55c0-4741-b5d1-c2a3b610dc5e', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 7, 'Cocina el otro lado hasta que este dorado.', NULL),
  ('b726839b-a524-4e4c-b314-575b694f6dad', '9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', 8, 'Sirve caliente con miel, mantequilla y frutas frescas.', NULL),
  ('e1bd388b-80e1-436b-8e8f-05934f0bef2f', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 1, 'Lava y seca muy bien las hojas de lechuga romana.', NULL),
  ('d7187ebc-2d21-4261-9973-a876346c5849', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 2, 'Corta o rompe las hojas en trozos del tamano de un bocado.', NULL),
  ('5c26b4b1-1211-41c5-92d6-bee8c86d0f54', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 3, 'Ralla el queso parmesano.', NULL),
  ('576ce00d-b6ff-4d6d-96be-0d4f76107791', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 4, 'En un bowl grande, mezcla la lechuga con el aderezo cesar.', NULL),
  ('cf9d69ee-d6da-4794-89a8-9271c77a39a0', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 5, 'Agrega los crutones y la mitad del queso, mezcla suavemente.', NULL),
  ('da2f198f-22f1-4b47-8d4c-54bd1f6eca87', 'dd8160f9-be79-4ed4-80dc-0c72af019112', 6, 'Sirve y decora con el resto del queso, un chorrito de limon y pimienta al gusto.', NULL),
  ('190de2e1-cb89-405b-bec5-d651667cd110', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 1, 'Precalienta el horno a 180C (350F). Engrasa y enharina un molde cuadrado.', NULL),
  ('53a125da-8112-4d81-b337-ca46b3ff8751', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 2, 'Derrite el chocolate con la mantequilla a bano maria o en microondas.', NULL),
  ('f33ce149-c266-4742-8386-9497fca61fe7', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 3, 'Deja enfriar un poco y agrega el azucar, mezclando bien.', NULL),
  ('7ff32f1b-b216-4fcd-b0dc-324d3a56753e', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 4, 'Incorpora los huevos uno a uno, batiendo despues de cada uno.', NULL),
  ('6960e942-fcf2-47e4-acf3-1cc615c63c50', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 5, 'Agrega la vainilla.', NULL),
  ('d5aefa0a-a80a-4e28-aee9-6dd84a99c7c5', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 6, 'Incorpora la harina tamizada y la sal, mezclando solo hasta combinar.', NULL),
  ('172b593f-acf7-4da7-8012-b774bec840f7', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 7, 'Vierte la mezcla en el molde preparado.', NULL),
  ('b827ef75-5827-4185-bb4a-7d02ce55cb14', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 8, 'Hornea por 25-30 minutos. El centro debe estar ligeramente humedo.', NULL),
  ('94a271c9-429a-4c38-804f-6270b6e57412', '6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', 9, 'Deja enfriar completamente antes de cortar.', NULL);

-- ============================================
-- RECIPE CATEGORIES (from Supabase)
-- ============================================
INSERT INTO recipe_categories (recipe_id, category_id) VALUES
  ('5f1ec9a2-29f0-461e-83b5-16d2596b94cf', '99caa761-dafc-4e12-8592-ed2142ae90f3'),
  ('59b601a7-1ee4-42c5-9c2d-97bc197366ea', 'eebf78e3-5319-44b6-bb85-7d94bbeaa570'),
  ('59b601a7-1ee4-42c5-9c2d-97bc197366ea', 'a7a729bd-8ff3-4e2b-9ce2-a22d17fa1cb8'),
  ('9c689b83-31a6-4d03-bcfc-9cc66af6d9e5', '99caa761-dafc-4e12-8592-ed2142ae90f3'),
  ('dd8160f9-be79-4ed4-80dc-0c72af019112', '2e7e35d0-0ffc-4b3c-a39a-4eba7d28235a'),
  ('dd8160f9-be79-4ed4-80dc-0c72af019112', 'eebf78e3-5319-44b6-bb85-7d94bbeaa570'),
  ('6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', '62057e9a-9d30-4e6c-8447-b6a79f0de7fa'),
  ('6d7e4d56-3d60-467e-8f0f-4dc9b69592cc', '2891c511-f265-4f23-bee4-fcf7eeab5bc4');

-- ============================================
-- BOOKMARKS (from Supabase)
-- ============================================
INSERT INTO bookmarks (id, user_id, recipe_id, created_at) VALUES
  ('2a96731d-a2c6-4e7c-aad2-0b1a0404fe09', '7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', '5f1ec9a2-29f0-461e-83b5-16d2596b94cf', '2026-01-22 03:15:39.331052+00');

-- ============================================
-- RECIPE LIKES (from Supabase)
-- ============================================
INSERT INTO recipe_likes (id, user_id, recipe_id, created_at) VALUES
  ('06e8057b-5112-428c-9a22-d5db6f3c3232', '7f9fbd1d-cb6b-4769-8bdf-b66d21245a1d', '5f1ec9a2-29f0-461e-83b5-16d2596b94cf', '2026-01-22 03:15:40.099487+00');
