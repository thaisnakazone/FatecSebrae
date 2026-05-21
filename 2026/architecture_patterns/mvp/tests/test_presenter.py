from presenter import SuspeitoPresenter
from fake_view import FakeView

fake_view = FakeView([
    "Fulano",     # nome
    "Furto",      # crime
    "5"           # nível
])

presenter = SuspeitoPresenter(fake_view)

presenter.adicionar_suspeito()

print(fake_view.saidas)