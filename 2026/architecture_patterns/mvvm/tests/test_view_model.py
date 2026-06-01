from view_model import SuspeitoViewModel

vm = SuspeitoViewModel()

print("\n=== TESTE 1: CADASTRO VÁLIDO ===")
vm.adicionar_novo("Fulano", "Furto", "5")
print("Status:", vm.mensagem_status)
print("Casos:", vm.contador_casos)

print("\n=== TESTE 2: NÍVEL INVÁLIDO (ACIMA DO LIMITE) ===")
vm.adicionar_novo("Beltrano", "Roubo", "1000")
print("Status:", vm.mensagem_status)

print("\n=== TESTE 3: NÍVEL INVÁLIDO (NÃO NUMÉRICO) ===")
vm.adicionar_novo("Sicrano", "Fraude", "abc")
print("Status:", vm.mensagem_status)

print("\n=== TESTE 4: ALERTA DE MUITOS CASOS ===")

# garante muitos registros sem depender do banco anterior
for i in range(6):
    vm.adicionar_novo(f"Teste{i}", "Crime", "5")

vm.atualizar_dados()
print("Casos:", vm.contador_casos)
print("Status:", vm.mensagem_status)

print("\n=== LISTA FINAL ===")
for item in vm.lista_suspeitos:
    print(item)