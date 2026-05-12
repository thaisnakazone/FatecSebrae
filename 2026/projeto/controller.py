from model import SuspeitoModel
from view import SuspeitoView

class SuspeitoController:
    def __init__(self):
        self.model = SuspeitoModel()
        self.view = SuspeitoView()

    def iniciar(self):
        while True:
            opcao = self.view.exibir_menu()

            if opcao == '1':
                nome, crime, nivel = self.view.obter_dados_suspeito()
                try:
                    self.model.salvar_suspeito(nome, crime, nivel)
                    self.view.mostrar_mensagem("Registro arquivado com sucesso!")
                except ValueError:
                    self.view.mostrar_mensagem("Erro: Nível de perigo deve ser um número!")

            elif opcao == '2':
                dados = self.model.listar_todos()
                self.view.mostrar_lista(dados)

            elif opcao == '0':
                self.view.mostrar_mensagem("Encerrando sistema...")
                break