-- "Telas" do briefing: pecas de um carrossel/trinca/sequencia, cada uma com sua
-- propria imagem (link) e texto -- seguindo o vocabulario padrao do guia interno
-- da conta ("Tela", nunca "Card"). Disponivel em qualquer tipo de job.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS briefing_screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  briefing_id INT NOT NULL,
  title VARCHAR(120) DEFAULT NULL,
  text_content TEXT,
  image_url VARCHAR(500) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
);
