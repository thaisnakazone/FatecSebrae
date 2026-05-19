import sqlite3

class SuspeitoModel:
    def __init__(self):
        self.db_name = 'vault_original.db'
        self._criar_tabela()

    def _criar_tabela(self):
        with sqlite3.connect(self.db_name) as conn:
            cursor = conn.cursor()
            cursor.execute('''CREATE TABLE IF NOT EXISTS suspeitos
                              (id INTEGER PRIMARY KEY, nome TEXT, crime TEXT, periculosidade INTEGER)''')
            conn.commit()

    def salvar_suspeito(self, nome, crime, nivel):
        with sqlite3.connect(self.db_name) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO suspeitos (nome, crime, periculosidade) VALUES (?, ?, ?)",
                          (nome, crime, int(nivel)))
            conn.commit()

    def listar_todos(self):
        with sqlite3.connect(self.db_name) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM suspeitos")
            return cursor.fetchall()