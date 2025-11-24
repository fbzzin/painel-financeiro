-- schema.sql

PRAGMA foreign_keys = ON;

-- USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' ou 'admin'
  is_approved INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TOKENS DE RESET DE SENHA (PRO)
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- METAS FINANCEIRAS (por usuário, global)
CREATE TABLE IF NOT EXISTS financeiro_metas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  meta_pc REAL DEFAULT 0,
  meta_civic REAL DEFAULT 0,
  meta_casa REAL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- FINANCEIRO MENSAL (renda + resumo)
CREATE TABLE IF NOT EXISTS financeiro_mensal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL, -- 1 a 12
  renda REAL DEFAULT 0,
  UNIQUE (user_id, ano, mes),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- DESPESAS DO PLANO FINANCEIRO
-- tipo: 'essencial', 'sup', 'divida_mes', 'divida_total'
CREATE TABLE IF NOT EXISTS financeiro_despesas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  valor REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- LANÇAMENTOS DE OPERAÇÃO (PV / ESC)
-- tipo_op: 'pv' ou 'esc'
CREATE TABLE IF NOT EXISTS operacao_lancamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tipo_op TEXT NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  data TEXT,
  conta TEXT,
  gasto REAL NOT NULL DEFAULT 0,
  retorno REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GASTOS ADICIONAIS POR OPERAÇÃO E MÊS
CREATE TABLE IF NOT EXISTS operacao_gastos_adicionais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tipo_op TEXT NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  descricao TEXT,
  valor REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
