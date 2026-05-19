from model import SuspeitoModel

class SuspeitoPresenter:
    def __init__(self, view):
        self.model = SuspeitoModel()
        self.view = view

    def adicionar_suspeito(self):
        nome = self.view.obter_input_usuario("Nome: ")
        crime = self.view.obter_input_usuario("Crime: ")

        if not nome or not crime:
            self.view.exibir_erro("Dados inválidos!")
            return

        while True:
            nivel_texto = self.view.obter_input_usuario("Nível (1 a 10): ")

            if not nivel_texto.isdigit():
                self.view.exibir_erro("Nível deve ser um número inteiro!")
                continue

            nivel = int(nivel_texto)

            if nivel < 1 or nivel > 10:
                self.view.exibir_erro("Nível deve estar entre 1 e 10!")
                continue

            break

        self.model.salvar_suspeito(nome, crime, nivel)
        self.view.exibir_sucesso("Suspeito fichado no sistema.")

    def listar_suspeitos(self):
        # O Presenter busca os dados brutos no Model
        dados_brutos = self.model.listar_todos()
        
        # O Presenter TRADUZ os dados para um formato que a View entenda
        dados_limpos = [
            f"ID #{s[0]}: {s[1].upper()} (Delito: {s[2]}) | Nível: {s[3]}"
            for s in dados_brutos
        ]
        
        self.view.mostrar_tabela_suspeitos(dados_limpos)

        # Contar e exibir total
        total = len(dados_brutos)
        self.view.exibir_total(total)