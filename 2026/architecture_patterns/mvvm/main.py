from view_model import SuspeitoViewModel
from view import SuspeitoView

if __name__ == "__main__":
    vm = SuspeitoViewModel()
    v = SuspeitoView(vm)

    while True:
        v.renderizar() # A View se desenha com o que estiver no VM
        op = v.menu()

        if op == '1':
            nome = input("Nome: ")
            crime = input("Crime: ")
            nivel = input("Nível (1-10): ")
            vm.adicionar_novo(nome, crime, nivel) # Alteramos o VM, não a View!
        elif op == '2':
            vm.atualizar_dados()
        elif op == '0':
            break