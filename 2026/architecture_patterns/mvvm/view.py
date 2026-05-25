class SuspeitoView:
    def __init__(self, view_model):
        self.vm = view_model

    def renderizar(self):
        """O método que desenha a tela baseada no estado do ViewModel"""
        print(f"\n--- 🛰️ PAINEL DE CONTROLE (Casos: {self.vm.contador_casos}) ---")
       
        for s in self.vm.lista_suspeitos:
            print(s)
       
        if self.vm.mensagem_status:
            print(f"\n[NOTIFICAÇÃO]: {self.vm.mensagem_status}")

    def menu(self):
        print("\n1. Novo Registro | 2. Atualizar Painel | 0. Sair")
        return input("Comando: ")