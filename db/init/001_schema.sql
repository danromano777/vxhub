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
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Secoes de conteudo de cada cliente (Logos, Fontes, Brandguide, Cores, ou qualquer
-- secao customizada criada pelo usuario no admin)
CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  type VARCHAR(40) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Blocos dentro de uma secao. block_type define quais campos sao relevantes:
-- image_download (file_url[, external_url]), video (file_url ou external_url),
-- font_card (font_name, font_file_url), color_palette (color_hex/rgb/cmyk/pantone),
-- pdf_viewer (external_url), link_item (external_url), code_snippet (code_content, code_language)
CREATE TABLE IF NOT EXISTS blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  block_type VARCHAR(40) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  file_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  external_url VARCHAR(500),
  font_name VARCHAR(160),
  font_file_url VARCHAR(500),
  color_hex VARCHAR(20),
  color_rgb VARCHAR(40),
  color_cmyk VARCHAR(40),
  color_pantone VARCHAR(80),
  code_content TEXT,
  code_language VARCHAR(40),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------
-- Seed: marcas migradas do BRANDS hardcoded em index.html
-- ---------------------------------------------------------------
INSERT INTO brands
  (slug,name,display_html,brand_group,filter_key,description,
   grad_a,grad_b,grad_c,grad_d,grad_base,grad_glow,grad_pale,logo_url,sort_order)
VALUES
('canal-brasil','Canal Brasil','Canal<br>Brasil','Nacional','nacional','Canal de entretenimento Canal Brasil',
  '#FFDC00','#FF3228','#00E1BE','#FF8C50','#151007','rgba(255,220,0,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/logo.png',1),
('espn','ESPN','ESPN','Esportes','esportes','Canal de esportes ESPN',
  '#FF2B2B','#B00018','#3A0008','#FF6A5A','#170206','rgba(255,43,43,.42)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/1962d0a2-7ff0-4337-829c-7600e5a409e8/logo.png',2),
('nbcu-hub','NBCU Hub','NBCU<br>Hub','NBCUniversal','nbcu','Hub de marcas NBCUniversal International Networks & Direct-to-Consumer',
  '#2ED9FF','#6C4BFF','#0B2A6B','#00E1BE','#07103a','rgba(108,75,255,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/5c5cf544-57b2-4f70-956c-a2b429def16a/logo.png',3),
('prio','Prio','Prio','Outros','outros','Arquivos prio',
  NULL,NULL,NULL,NULL,NULL,NULL,FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/18e03608-8933-427e-9e69-b5ad25bbec92/logo.png',4),
('sony-channel','Sony Channel','Sony<br>Channel','Sony','sony','Canal de entretenimento Sony Channel',
  '#FF9A2E','#FF2D6F','#7A1FA8','#FFD84D','#2a0a1e','rgba(255,45,111,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/a33ae4bb-0bcd-4cc2-b9b2-87dc7fa63b0b/logo.png',5),
('sony-home-entertainment','Sony Home Entertainment','Sony Home<br>Entertainment','Sony','sony','Catálogo de home entertainment da Sony Pictures',
  '#FFFFFF','#D8DEE3','#9AA6AE','#FFFFFF','#cfd6db','rgba(216,222,227,.5)',TRUE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/c1520297-c704-4d49-a6e5-0ae6a6ecf5fd/logo.png',6),
('sony-one','Sony One','Sony<br>One','Sony','sony','Plataforma Sony One',
  '#3E7BFF','#A63BFF','#FF3D9A','#22D3EE','#130a3a','rgba(166,59,255,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/97e935d8-bfb3-4c2b-9a4d-2c81c789f7e6/logo.png',7),
('studio-universal','Studio Universal','Studio<br>Universal','NBCUniversal','nbcu','Canal de cinema Studio Universal',
  '#16E0B0','#0FA3C9','#06463F','#9DF25A','#04241f','rgba(22,224,176,.44)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/6cfa09b4-005d-451a-ab67-e5c9b1a1307c/logo.png',8),
('universal-tv','Universal TV','Universal<br>TV','NBCUniversal','nbcu','Canal de séries Universal TV',
  '#FF5A3C','#FF2D8A','#7A1250','#FFB03A','#2a0616','rgba(255,45,138,.44)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/3551003f-5eac-4fc7-b5e4-3fb8d4226315/logo.png',9),
('usa','USA','USA','NBCUniversal','nbcu','Canal USA Network',
  '#FF3B30','#1E4FD8','#0A0A12','#FF7A5A','#0a0a12','rgba(255,59,48,.42)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/5b8ae1e7-e770-4518-bf3a-9eab2024c863/logo.png',10),
('vx','VX','VX','Agência','vx','Identidade da VX Comunicação',
  '#C4FF4D','#18E0C8','#05463F','#E6FF9A','#07261f','rgba(196,255,77,.45)',FALSE,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/clients/e11f697a-f76b-4fff-be48-0053557482f1/logo.png',11);

-- ---------------------------------------------------------------
-- Secoes padrao (Logos, Fontes, Brandguide, Cores) para todos os clientes
-- ---------------------------------------------------------------
INSERT INTO sections (brand_id, title, type, sort_order)
SELECT b.id, d.title, d.type, d.ord
FROM brands b, (
  SELECT 'Logos' title, 'logos' type, 0 ord
  UNION ALL SELECT 'Fontes','fontes',1
  UNION ALL SELECT 'Brandguide','brandguide',2
  UNION ALL SELECT 'Cores','cores',3
) d;

-- ---------------------------------------------------------------
-- Blocos do Canal Brasil (dados reais migrados do hub de referencia)
-- ---------------------------------------------------------------
INSERT INTO blocks (section_id, block_type, title, file_url, sort_order)
SELECT s.id, 'image_download', d.title, d.file_url, d.ord
FROM sections s JOIN brands b ON b.id = s.brand_id
CROSS JOIN (
  SELECT 'logo_canalbrasil_reducao1_amarelo' title,
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546885570.png' file_url, 0 ord
  UNION ALL SELECT 'logo_canalbrasil_reducao1_aqua',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546897803.png', 1
  UNION ALL SELECT 'logo_canalbrasil_reducao1_azul',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546907073.png', 2
  UNION ALL SELECT 'logo_canalbrasil_reducao1_branco',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546916673.png', 3
  UNION ALL SELECT 'logo_canalbrasil_reducao1_marrom',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546935859.png', 4
  UNION ALL SELECT 'logo_canalbrasil_reducao1_preto',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546945676.png', 5
  UNION ALL SELECT 'logo_canalbrasil_reducao1_salmao',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546956364.png', 6
  UNION ALL SELECT 'logo_canalbrasil_reducao1_vermelho',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546967839.png', 7
  UNION ALL SELECT 'logo_canalbrasil_reducao1_verde',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546979179.png', 8
  UNION ALL SELECT 'logo_canalbrasil_reducao1_cinza',
    'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/50b1a79b-e132-4253-bd3c-e545408ea004/1769546989963.png', 9
) d
WHERE b.slug = 'canal-brasil' AND s.type = 'logos';

INSERT INTO blocks (section_id, block_type, title, external_url, sort_order)
SELECT s.id, 'link_item', 'Logo do Canal Brasil (Todos os Formatos)',
  'https://drive.google.com/drive/folders/1GgEPJgIaKCxNjF13PLUSVBnhZv3DVFtJ?usp=sharing', 10
FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug = 'canal-brasil' AND s.type = 'logos';

INSERT INTO blocks (section_id, block_type, title, font_name, font_file_url, sort_order)
SELECT s.id, 'font_card', d.title, d.title,
  'https://lxrnatulhlmxthgribwl.supabase.co/storage/v1/object/public/files/51cd42a2-ef06-4db4-877f-8a545f94aa47/6e95f2e4-36f9-4670-956f-d4b79e9ec872/1769547205124.ttf', d.ord
FROM sections s JOIN brands b ON b.id = s.brand_id
CROSS JOIN (SELECT 'Canal Brasil' title, 0 ord UNION ALL SELECT 'Sharp Grotesk', 1) d
WHERE b.slug = 'canal-brasil' AND s.type = 'fontes';

INSERT INTO blocks (section_id, block_type, title, external_url, sort_order)
SELECT s.id, 'link_item', 'Todas as Fontes do Canal Brasil',
  'https://drive.google.com/drive/folders/1R_wZ6hv3nJ7uUa8--WJVFUh3uRzoHhxp?usp=sharing', 2
FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug = 'canal-brasil' AND s.type = 'fontes';

INSERT INTO blocks (section_id, block_type, external_url, sort_order)
SELECT s.id, 'pdf_viewer', 'https://drive.google.com/file/d/1ilFyHSYBt43bFtrLBsSbbbw5CL_9uaD_/preview', 0
FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug = 'canal-brasil' AND s.type = 'brandguide';

INSERT INTO blocks (section_id, block_type, title, color_hex, color_pantone, sort_order)
SELECT s.id, 'color_palette', d.title, d.hex, d.pantone, d.ord
FROM sections s JOIN brands b ON b.id = s.brand_id
CROSS JOIN (
  SELECT 'Preto' title,'#000000' hex,'BLACK C' pantone,0 ord
  UNION ALL SELECT 'Amarelo','#FFDC00','108 C',1
  UNION ALL SELECT 'Verde','#003C00','2427 C',2
  UNION ALL SELECT 'Marrom','#3C2D19','7554 C',3
  UNION ALL SELECT 'Vermelho','#FF3228','BRIGHT RED',4
  UNION ALL SELECT 'Verde Água','#00E1BE','325 C',5
  UNION ALL SELECT 'Cinza','#F8F9F7','White Smoke',6
  UNION ALL SELECT 'Azul','#005096','2144 C',7
  UNION ALL SELECT 'Laranja','#FF8C50','163 C',8
  UNION ALL SELECT 'Branco','#ffffff','White',9
) d
WHERE b.slug = 'canal-brasil' AND s.type = 'cores';

INSERT INTO blocks (section_id, block_type, title, external_url, sort_order)
SELECT s.id, 'link_item', 'Canal Brasil (Swatch Color)',
  'https://drive.google.com/drive/folders/1GhTOVGfEIeNuvYf3-EgtOCm0TKHQEaTa?usp=sharing', 10
FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug = 'canal-brasil' AND s.type = 'cores';

-- ---------------------------------------------------------------
-- Blocos padrao para os demais clientes: logo principal na secao de Logos
-- e a paleta de gradiente (grad_a-d) na secao de Cores
-- ---------------------------------------------------------------
INSERT INTO blocks (section_id, block_type, title, file_url, sort_order)
SELECT s.id, 'image_download', CONCAT('Logo ', b.name), b.logo_url, 0
FROM sections s JOIN brands b ON b.id = s.brand_id
WHERE b.slug <> 'canal-brasil' AND s.type = 'logos' AND b.logo_url IS NOT NULL AND b.logo_url <> '';

INSERT INTO blocks (section_id, block_type, color_hex, sort_order)
SELECT s.id, 'color_palette', b.grad_a, 0 FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug <> 'canal-brasil' AND s.type = 'cores' AND b.grad_a IS NOT NULL
UNION ALL
SELECT s.id, 'color_palette', b.grad_b, 1 FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug <> 'canal-brasil' AND s.type = 'cores' AND b.grad_b IS NOT NULL
UNION ALL
SELECT s.id, 'color_palette', b.grad_c, 2 FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug <> 'canal-brasil' AND s.type = 'cores' AND b.grad_c IS NOT NULL
UNION ALL
SELECT s.id, 'color_palette', b.grad_d, 3 FROM sections s JOIN brands b ON b.id = s.brand_id WHERE b.slug <> 'canal-brasil' AND s.type = 'cores' AND b.grad_d IS NOT NULL;
