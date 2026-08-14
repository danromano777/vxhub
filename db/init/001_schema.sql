-- VX Hub Admin — schema + seed
-- Executado automaticamente pelo container MySQL na primeira inicializacao
-- (montado em /docker-entrypoint-initdb.d)

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  display_html VARCHAR(160) NOT NULL,
  brand_group VARCHAR(80) NOT NULL,
  filter_key VARCHAR(80) NOT NULL,
  description TEXT,
  grad_a VARCHAR(20), grad_b VARCHAR(20), grad_c VARCHAR(20), grad_d VARCHAR(20),
  grad_base VARCHAR(20), grad_glow VARCHAR(40), grad_pale BOOLEAN DEFAULT FALSE,
  logo_url VARCHAR(500),
  drive_logos_url VARCHAR(500), drive_fonts_url VARCHAR(500), drive_colors_url VARCHAR(500),
  brandguide_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brand_logos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  name VARCHAR(160),
  hex VARCHAR(20),
  image_url VARCHAR(500),
  sort_order INT DEFAULT 0,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brand_fonts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  name VARCHAR(160),
  sort_order INT DEFAULT 0,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brand_colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  hex VARCHAR(20),
  rgb VARCHAR(40),
  cmyk VARCHAR(40),
  pantone VARCHAR(80),
  sort_order INT DEFAULT 0,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Seed: marcas migradas do BRANDS hardcoded em index.html
-- ---------------------------------------------------------------
INSERT INTO brands
  (slug,name,display_html,brand_group,filter_key,description,
   grad_a,grad_b,grad_c,grad_d,grad_base,grad_glow,grad_pale,logo_url,
   drive_logos_url,drive_fonts_url,drive_colors_url,brandguide_url,sort_order)
VALUES
('canal-brasil','Canal Brasil','Canal<br>Brasil','Nacional','nacional','Canal de entretenimento Canal Brasil',
  '#FFDC00','#FF3228','#00E1BE','#FF8C50','#151007','rgba(255,220,0,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/logo.png',
  'https://drive.google.com/drive/folders/1GgEPJgIaKCxNjF13PLUSVBnhZv3DVFtJ?usp=sharing',
  'https://drive.google.com/drive/folders/1R_wZ6hv3nJ7uUa8--WJVFUh3uRzoHhxp?usp=sharing',
  'https://drive.google.com/drive/folders/1GhTOVGfEIeNuvYf3-EgtOCm0TKHQEaTa?usp=sharing',
  'https://drive.google.com/file/d/1ilFyHSYBt43bFtrLBsSbbbw5CL_9uaD_/preview',1),
('espn','ESPN','ESPN','Esportes','esportes','Canal de esportes ESPN',
  '#FF2B2B','#B00018','#3A0008','#FF6A5A','#170206','rgba(255,43,43,.42)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/1962d0a2-7ff0-4337-829c-7600e5a409e8/logo.png',
  '','','','',2),
('nbcu-hub','NBCU Hub','NBCU<br>Hub','NBCUniversal','nbcu','Hub de marcas NBCUniversal International Networks & Direct-to-Consumer',
  '#2ED9FF','#6C4BFF','#0B2A6B','#00E1BE','#07103a','rgba(108,75,255,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/5c5cf544-57b2-4f70-956c-a2b429def16a/logo.png',
  '','','','',3),
('prio','Prio','Prio','Outros','outros','Arquivos prio',
  NULL,NULL,NULL,NULL,NULL,NULL,FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/18e03608-8933-427e-9e69-b5ad25bbec92/logo.png',
  '','','','',4),
('sony-channel','Sony Channel','Sony<br>Channel','Sony','sony','Canal de entretenimento Sony Channel',
  '#FF9A2E','#FF2D6F','#7A1FA8','#FFD84D','#2a0a1e','rgba(255,45,111,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/a33ae4bb-0bcd-4cc2-b9b2-87dc7fa63b0b/logo.png',
  '','','','',5),
('sony-home-entertainment','Sony Home Entertainment','Sony Home<br>Entertainment','Sony','sony','Catálogo de home entertainment da Sony Pictures',
  '#FFFFFF','#D8DEE3','#9AA6AE','#FFFFFF','#cfd6db','rgba(216,222,227,.5)',TRUE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/c1520297-c704-4d49-a6e5-0ae6a6ecf5fd/logo.png',
  '','','','',6),
('sony-one','Sony One','Sony<br>One','Sony','sony','Plataforma Sony One',
  '#3E7BFF','#A63BFF','#FF3D9A','#22D3EE','#130a3a','rgba(166,59,255,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/97e935d8-bfb3-4c2b-9a4d-2c81c789f7e6/logo.png',
  '','','','',7),
('studio-universal','Studio Universal','Studio<br>Universal','NBCUniversal','nbcu','Canal de cinema Studio Universal',
  '#16E0B0','#0FA3C9','#06463F','#9DF25A','#04241f','rgba(22,224,176,.44)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/6cfa09b4-005d-451a-ab67-e5c9b1a1307c/logo.png',
  '','','','',8),
('universal-tv','Universal TV','Universal<br>TV','NBCUniversal','nbcu','Canal de séries Universal TV',
  '#FF5A3C','#FF2D8A','#7A1250','#FFB03A','#2a0616','rgba(255,45,138,.44)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/3551003f-5eac-4fc7-b5e4-3fb8d4226315/logo.png',
  '','','','',9),
('usa','USA','USA','NBCUniversal','nbcu','Canal USA Network',
  '#FF3B30','#1E4FD8','#0A0A12','#FF7A5A','#0a0a12','rgba(255,59,48,.42)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/5b8ae1e7-e770-4518-bf3a-9eab2024c863/logo.png',
  '','','','',10),
('vx','VX','VX','Agência','vx','Identidade da VX Comunicação',
  '#C4FF4D','#18E0C8','#05463F','#E6FF9A','#07261f','rgba(196,255,77,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/e11f697a-f76b-4fff-be48-0053557482f1/logo.png',
  '','','','',11);

-- Logos (Canal Brasil e o unico cliente com itens preenchidos na origem)
INSERT INTO brand_logos (brand_id,name,hex,sort_order)
SELECT id,d.name,d.hex,d.ord FROM brands,
  (SELECT 'redução 1 · amarelo' name,'#FFDC00' hex,1 ord
   UNION ALL SELECT 'redução 1 · aqua','#00E1BE',2
   UNION ALL SELECT 'redução 1 · azul','#005096',3
   UNION ALL SELECT 'redução 1 · branco','#FFFFFF',4
   UNION ALL SELECT 'redução 1 · marrom','#3C2D19',5
   UNION ALL SELECT 'redução 1 · preto','#000000',6
   UNION ALL SELECT 'redução 1 · salmão','#FF8C50',7
   UNION ALL SELECT 'redução 1 · vermelho','#FF3228',8
   UNION ALL SELECT 'redução 1 · verde','#003C00',9
   UNION ALL SELECT 'redução 1 · cinza','#F8F9F7',10) d
WHERE brands.slug='canal-brasil';

-- Fontes
INSERT INTO brand_fonts (brand_id,name,sort_order)
SELECT id,d.name,d.ord FROM brands,
  (SELECT 'Canal Brasil' name,1 ord UNION ALL SELECT 'Sharp Grotesk',2) d
WHERE brands.slug='canal-brasil';

-- Cores
INSERT INTO brand_colors (brand_id,hex,rgb,cmyk,pantone,sort_order)
SELECT id,d.hex,d.rgb,d.cmyk,d.pantone,d.ord FROM brands,
  (SELECT '#000000' hex,'0 0 0' rgb,'0 0 0 100' cmyk,'Black C' pantone,1 ord
   UNION ALL SELECT '#FFDC00','255 220 0','0 14 100 0','108 C',2
   UNION ALL SELECT '#003C00','0 60 0','100 0 100 76','2427 C',3
   UNION ALL SELECT '#3C2D19','60 45 25','0 25 58 76','7554 C',4
   UNION ALL SELECT '#FF3228','255 50 40','0 80 84 0','Bright Red',5
   UNION ALL SELECT '#00E1BE','0 225 190','100 0 16 12','325 C',6
   UNION ALL SELECT '#F8F9F7','248 249 247','0 0 1 2','White Smoke',7
   UNION ALL SELECT '#005096','0 80 150','100 47 0 41','2144 C',8
   UNION ALL SELECT '#FF8C50','255 140 80','0 45 69 0','163 C',9
   UNION ALL SELECT '#FFFFFF','255 255 255','0 0 0 0','White',10) d
WHERE brands.slug='canal-brasil';
