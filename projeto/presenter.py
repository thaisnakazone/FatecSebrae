from model import SuspeitoModel

class SuspeitoPresenter:
    def __init__(self, view):
        self.model = SuspeitoModel()
        self.view = view

    def adicionar_suspeito(self):
        nome = self.view.obter_input_usuario("Nome: ")
        crime = self.view.obter_input_usuario("Crime: ")
       
        if nome and crime:
            self.model.salvar_no_banco(nome, crime)
            self.view.exibir_sucesso("Suspeito fichado no sistema.")
        else:
            self.view.exibir_erro("Dados inválidos!")

    def listar_suspeitos(self):
        # O Presenter busca os dados brutos no Model
        dados_brutos = self.model.listar_todos()
       
        # O Presenter TRADUZ os dados para um formato que a View entenda
        # (Isso é a essência do MVP)
        dados_limpos = [f"ID #{s[0]}: {s[1].upper()} (Delito: {s[2]})" for s in dados_brutos]
       
        self.view.mostrar_tabela_suspeitos(dados_limpos)