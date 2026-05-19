class SuspeitoView:
    # A View agora apenas recebe ordens do que imprimir
    def exibir_sucesso(self, mensagem):
        print(f"\n[OK] {mensagem}")

    def exibir_erro(self, mensagem):
        print(f"\n[ERRO] {mensagem}")

    def mostrar_tabela_suspeitos(self, lista_formatada):
        print("\n--- RELATÓRIO DE INVESTIGAÇÃO ---")
        for linha in lista_formatada:
            print(linha)

    def obter_input_usuario(self, prompt):
        return input(prompt)
    
    def exibir_total(self, total):
        print(f"\nTotal de suspeitos cadastrados: {total}")