from model import SuspeitoModel

class SuspeitoViewModel:
    def __init__(self):
        self.model = SuspeitoModel()
        # O "Estado": Aqui ficam os dados que a View vai observar
        self.lista_suspeitos = []
        self.mensagem_status = ""
        self.contador_casos = 0

    def atualizar_dados(self):
        dados = self.model.listar_todos()

        self.lista_suspeitos = [
            f"SUSPEITO: {s[1].upper()} | CRIME: {s[2]} | NÍVEL: {s[3]}"
            for s in dados
        ]

        self.contador_casos = len(dados)

        if self.contador_casos > 5:
            self.mensagem_status = "ALERTA: Muitos casos!"
        else:
            self.mensagem_status = "Base de dados atualizada com sucesso!"

    def adicionar_novo(self, nome, crime, nivel):
        if not nome or not crime or not nivel:
            self.mensagem_status = "Erro: Dados incompletos!"
            return

        if not nivel.isdigit():
            self.mensagem_status = "Erro: Nível deve ser um número inteiro!"
            return

        nivel_int = int(nivel)

        if nivel_int < 1 or nivel_int > 10:
            self.mensagem_status = "Erro: Nível deve estar entre 1 e 10!"
            return

        self.model.salvar_suspeito(nome, crime, nivel_int)

        # Atualiza o estado interno
        self.atualizar_dados()