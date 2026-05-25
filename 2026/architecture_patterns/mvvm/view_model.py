from model import SuspeitoModel

class SuspeitoViewModel:
    def __init__(self):
        self.model = SuspeitoModel()
        # O "Estado": Aqui ficam os dados que a View vai observar
        self.lista_suspeitos = []
        self.mensagem_status = ""
        self.contador_casos = 0

    def atualizar_dados(self):
        """Transforma dados brutos do Model em dados prontos para a View"""
        dados = self.model.listar_todos()
        # Formata os dados (Lógica de Apresentação)
        self.lista_suspeitos = [f"SUSPEITO: {s[1]} | CRIME: {s[2]}" for s in dados]
        self.contador_casos = len(dados)
        self.mensagem_status = "Base de dados atualizada com sucesso!"

    def adicionar_novo(self, nome, crime, nivel):
        if nome and crime and nivel:
            self.model.salvar_suspeito(nome, crime, nivel)
            self.atualizar_dados() # Atualiza o estado interno
        else:
            self.mensagem_status = "Erro: Dados incompletos!"