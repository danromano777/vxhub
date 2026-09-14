-- Plataforma de briefing interna: briefings de job por cliente + historico de status
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS briefings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT DEFAULT NULL,
  title VARCHAR(200) NOT NULL,
  job_type VARCHAR(80) NOT NULL DEFAULT '',
  requester_name VARCHAR(120) NOT NULL DEFAULT '',
  objective TEXT,
  target_audience TEXT,
  key_message TEXT,
  deadline DATE DEFAULT NULL,
  budget VARCHAR(80) DEFAULT '',
  references_text TEXT,
  notes TEXT,
  status ENUM('rascunho','enviado','em_revisao','aprovado','reprovado') NOT NULL DEFAULT 'rascunho',
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Historico de mudancas de status (rascunho -> enviado -> em_revisao -> aprovado/reprovado)
CREATE TABLE IF NOT EXISTS briefing_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  briefing_id INT NOT NULL,
  from_status VARCHAR(20) DEFAULT NULL,
  to_status VARCHAR(20) NOT NULL,
  note TEXT,
  changed_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);
