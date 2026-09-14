-- Evolui a plataforma de briefing: sigla de nomenclatura por cliente, clientes da
-- esteira ON+OFF que ainda nao existiam no hub, e os campos do briefing completo
-- (estrutura baseada no prompt mestre do Agente de Briefings VX).
SET NAMES utf8mb4;

ALTER TABLE brands
  ADD COLUMN code VARCHAR(20) DEFAULT NULL,
  ADD COLUMN briefing_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD UNIQUE KEY brands_code_unique (code);

ALTER TABLE briefings
  ADD COLUMN campaign_name VARCHAR(160) DEFAULT NULL,
  ADD COLUMN job_size ENUM('P','M','G') DEFAULT NULL,
  ADD COLUMN start_date DATE DEFAULT NULL,
  ADD COLUMN context TEXT,
  ADD COLUMN product_service TEXT,
  ADD COLUMN concept TEXT,
  ADD COLUMN scope TEXT,
  ADD COLUMN channels TEXT,
  ADD COLUMN kpis TEXT,
  ADD COLUMN dos_donts TEXT,
  ADD COLUMN history_notes TEXT,
  ADD COLUMN open_points TEXT,
  ADD COLUMN piece_format ENUM('EST','VID') NOT NULL DEFAULT 'EST',
  ADD COLUMN piece_count INT NOT NULL DEFAULT 1,
  ADD COLUMN video_channel VARCHAR(20) DEFAULT NULL;

-- Siglas dos clientes que ja existem no hub (tabela NOMENCLATURA ESTEIRA ON+OFF+PRIO)
UPDATE brands SET code = 'CB' WHERE slug = 'canal-brasil';
UPDATE brands SET code = 'ESPN' WHERE slug = 'espn';
UPDATE brands SET code = 'VX' WHERE slug = 'vx';

-- Demais clientes da esteira ON+OFF que ainda nao existiam no hub: cadastrados
-- apenas para uso no seletor de cliente do briefing (briefing_only), sem entrar
-- na home publica de assets.
INSERT INTO brands
  (slug, name, display_html, brand_group, filter_key, description, code, briefing_only, sort_order)
VALUES
  ('aladdin','Aladdin','Aladdin','Clientes VX','briefing','Cliente da esteira ON+OFF','ALAD',TRUE,20),
  ('casa-roberto-marinho','Casa Roberto Marinho','Casa Roberto<br>Marinho','Clientes VX','briefing','Cliente da esteira ON+OFF','CRM',TRUE,21),
  ('coach-ism','Coach ISM','Coach<br>ISM','Clientes VX','briefing','Cliente da esteira ON+OFF','CISM',TRUE,22),
  ('colicaliv','Colicaliv','Colicaliv','Clientes VX','briefing','Cliente da esteira ON+OFF','CALIV',TRUE,23),
  ('costa-verde','Costa Verde','Costa<br>Verde','Clientes VX','briefing','Cliente da esteira ON+OFF','CV',TRUE,24),
  ('universo-herbarium','Universo Herbarium','Universo<br>Herbarium','Clientes VX','briefing','Cliente da esteira ON+OFF','UH',TRUE,25),
  ('globoplay','Globoplay','Globoplay','Clientes VX','briefing','Cliente da esteira ON+OFF','GPLAY',TRUE,26),
  ('globo-internacional','Globo Internacional','Globo<br>Internacional','Clientes VX','briefing','Cliente da esteira ON+OFF','GINTER',TRUE,27),
  ('gnt','GNT','GNT','Clientes VX','briefing','Cliente da esteira ON+OFF','GNT',TRUE,28),
  ('megapix','Megapix','Megapix','Clientes VX','briefing','Cliente da esteira ON+OFF','MPX',TRUE,29),
  ('multishow','Multishow','Multishow','Clientes VX','briefing','Cliente da esteira ON+OFF','MSW',TRUE,30),
  ('musquee','Musquee','Musquee','Clientes VX','briefing','Cliente da esteira ON+OFF','MUS',TRUE,31),
  ('omater-gest','Omater Gest','Omater<br>Gest','Clientes VX','briefing','Cliente da esteira ON+OFF','OG',TRUE,32),
  ('oshadhi','Oshadhi','Oshadhi','Clientes VX','briefing','Cliente da esteira ON+OFF','OSH',TRUE,33),
  ('riberalves','Riberalves','Riberalves','Clientes VX','briefing','Cliente da esteira ON+OFF','RIB',TRUE,34),
  ('soter','Soter','Soter','Clientes VX','briefing','Cliente da esteira ON+OFF','SOTER',TRUE,35),
  ('stanley','Stanley','Stanley','Clientes VX','briefing','Cliente da esteira ON+OFF','STNL',TRUE,36),
  ('vx-portugal','VX Portugal','VX<br>Portugal','Clientes VX','briefing','Cliente da esteira ON+OFF','VXPT',TRUE,37),
  ('ecoponte','Ecoponte','Ecoponte','Clientes VX','briefing','Cliente da esteira ON+OFF','ECO',TRUE,38);
