class FakeView:
    def __init__(self, entradas):
        self.entradas = entradas
        self.saidas = []
        self.index = 0

    def obter_input_usuario(self, prompt):
        valor = self.entradas[self.index]
        self.index += 1
        return valor

    def exibir_sucesso(self, mensagem):
        self.saidas.append(("OK", mensagem))

    def exibir_erro(self, mensagem):
        self.saidas.append(("ERRO", mensagem))

    def mostrar_tabela_suspeitos(self, lista_formatada):
        self.saidas.append(("LISTA", lista_formatada))