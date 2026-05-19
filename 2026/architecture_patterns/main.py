from view import SuspeitoView
from presenter import SuspeitoPresenter

if __name__ == "__main__":
    v = SuspeitoView()
    p = SuspeitoPresenter(v)
   
    # Loop de execução
    while True:
        print("\n1. Adicionar | 2. Listar | 0. Sair")
        op = v.obter_input_usuario("Escolha: ")
        if op == '1': p.adicionar_suspeito()
        elif op == '2': p.listar_suspeitos()
        elif op == '0': break