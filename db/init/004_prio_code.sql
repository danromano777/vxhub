-- Prio nao estava na tabela de siglas do documento de nomenclatura (so aparece
-- citado como equipe/time separado da esteira ON+OFF); usa o proprio nome como
-- sigla, seguindo o mesmo padrao de clientes com nome curto (VX, GNT, Soter).
SET NAMES utf8mb4;

UPDATE brands SET code = 'PRIO' WHERE slug = 'prio';
