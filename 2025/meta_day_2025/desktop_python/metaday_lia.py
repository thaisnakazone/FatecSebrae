import sys
import threading
import pyttsx3
import recursos_rc  # importa o arquivo gerado
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QPushButton, QVBoxLayout,
    QHBoxLayout, QLineEdit, QMessageBox
)
from PyQt5.QtGui import QPixmap, QFont
from PyQt5.QtCore import Qt, QTimer, pyqtSignal

# Dados dos andares
dados_andares = {
    "Térreo": "No térreo, você encontrará a feira de empreendedores e negócios.",
    "1º andar": "No 1º andar, estão as palestras e workshops.",
    "2º andar": "No 2º andar, temos a área de startups e inovação.",
    "3º andar": "No 3º andar, está a praça de alimentação.",
    "4º andar": "No 4º andar, temos o espaço de networking."
}

# Tempos de boca (ms)
tempo_fechada = 150
tempo_aberta = 650

# Velocidade da fala
velocidade_fala = 210

# Tamanho do avatar
avatar_largura = 300
avatar_altura = 500

class MetaDayApp(QWidget):
    primeira_fala_terminou = pyqtSignal()

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Meta Day Fatec Sebrae - Lia")
        self.setStyleSheet("background-color: #f0f0f0; font-family: Arial;")
        
        self.animando = False
        self.boca_aberta = False
        self._texto2_encadeado = ""

        self.img_fechada = QPixmap(":/avatar_fechada.png")
        self.img_aberta = QPixmap(":/avatar_aberta.png")

        self.timer_boca = QTimer()
        self.timer_boca.timeout.connect(self.trocar_boca)

        self.primeira_fala_terminou.connect(self._depois_primeira_fala)
        
        self.layout_principal = QVBoxLayout()
        self.setLayout(self.layout_principal)
        
        self.tela_nome()
    
    def tela_nome(self):
        self.limpar_tela()
        label_nome = QLabel("Digite seu nome para começar:")
        label_nome.setAlignment(Qt.AlignCenter)
        label_nome.setFont(QFont("Arial", 18))
        
        self.input_nome = QLineEdit()
        self.input_nome.setPlaceholderText("Seu nome")
        self.input_nome.setFont(QFont("Arial", 16))
        self.input_nome.setStyleSheet("padding: 8px;")
        
        btn_entrar = QPushButton("Entrar")
        btn_entrar.setFont(QFont("Arial", 16))
        btn_entrar.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        btn_entrar.clicked.connect(self.iniciar)
        
        self.layout_principal.addWidget(label_nome)
        self.layout_principal.addWidget(self.input_nome)
        self.layout_principal.addWidget(btn_entrar, alignment=Qt.AlignCenter)
    
    def tela_menu(self, nome):
        self.showMaximized()  # <-- maximiza só a segunda tela
        
        self.limpar_tela()

        self.avatar = QLabel()
        pixmap_fechada = self.img_fechada.scaled(avatar_largura, avatar_altura, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self.avatar.setPixmap(pixmap_fechada)
        self.avatar.setAlignment(Qt.AlignCenter)
        
        self.saudacao = QLabel(f"Olá, {nome}! Eu sou a Lia. É um prazer ter você aqui conosco no Meta Day Fatec Sebrae!")
        self.saudacao.setAlignment(Qt.AlignCenter)
        self.saudacao.setFont(QFont("Arial", 18, QFont.Bold))
        
        self.frase_guia = QLabel("")
        self.frase_guia.setAlignment(Qt.AlignCenter)
        self.frase_guia.setFont(QFont("Arial", 17, QFont.Bold))
        self.frase_guia.setStyleSheet("color: #F76711;")  # laranja
        
        botoes_layout = QHBoxLayout()
        for andar in dados_andares.keys():
            btn = QPushButton(andar)
            btn.setFont(QFont("Arial", 14))
            btn.setStyleSheet("""
                QPushButton {
                    background-color: #2196F3;
                    color: white;
                    padding: 8px 14px;
                    border-radius: 6px;
                }
                QPushButton:hover {
                    background-color: #1976D2;
                }
            """)
            btn.clicked.connect(lambda _, a=andar: self.mostrar_info(a))
            botoes_layout.addWidget(btn)
        
        self.info = QLabel("")
        self.info.setAlignment(Qt.AlignCenter)
        self.info.setWordWrap(True)
        self.info.setFont(QFont("Arial", 16, QFont.Bold))
        self.info.setStyleSheet("color: #000066") # azul
        
        self.layout_principal.addWidget(self.avatar)
        self.layout_principal.addWidget(self.saudacao)
        self.layout_principal.addWidget(self.frase_guia)
        self.layout_principal.addLayout(botoes_layout)
        self.layout_principal.addWidget(self.info)
    
    def limpar_tela(self):
        while self.layout_principal.count():
            item = self.layout_principal.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()
    
    def iniciar(self):
        nome = self.input_nome.text().strip()
        if not nome:
            QMessageBox.warning(self, "Aviso", "Digite seu nome!")
            return
        self.tela_menu(nome)
        self.falar_com_encadeamento(
            f"Olá, {nome}! Eu sou a Lia. É um prazer ter você aqui conosco no Meta Day Fatec Sebrae!",
            "Clique nos botões abaixo e descubra o que há em cada andar."
        )
    
    def mostrar_info(self, andar):
        self.info.setText(dados_andares[andar])
        self.falar(dados_andares[andar])
    
    def falar(self, texto):
        self.animando = True
        self.boca_aberta = False
        self.timer_boca.start(tempo_fechada)

        def _fala():
            local_engine = pyttsx3.init()
            local_engine.setProperty('rate', velocidade_fala)
            for voice in local_engine.getProperty('voices'):
                if "maria" in voice.name.lower() and "portuguese" in voice.name.lower():
                    local_engine.setProperty('voice', voice.id)
                    break
            local_engine.say(texto)
            local_engine.runAndWait()
            QTimer.singleShot(0, self.parar_boca)

        threading.Thread(target=_fala, daemon=True).start()

    def falar_com_encadeamento(self, texto1, texto2):
        self._texto2_encadeado = texto2
        self.animando = True
        self.boca_aberta = False
        self.timer_boca.start(tempo_fechada)

        def _fala():
            engine = pyttsx3.init()
            engine.setProperty('rate', velocidade_fala)
            for voice in engine.getProperty('voices'):
                if "maria" in voice.name.lower() and "portuguese" in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    break
            engine.say(texto1)
            engine.runAndWait()
            self.primeira_fala_terminou.emit()

        threading.Thread(target=_fala, daemon=True).start()

    def _depois_primeira_fala(self):
        self.parar_boca()
        self.frase_guia.setText("Clique nos botões abaixo e descubra o que há em cada andar.")
        self.falar(self._texto2_encadeado)

    def trocar_boca(self):
        if not self.animando:
            return
        self.boca_aberta = not self.boca_aberta
        if self.boca_aberta:
            pixmap = self.img_aberta.scaled(avatar_largura, avatar_altura, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        else:
            pixmap = self.img_fechada.scaled(avatar_largura, avatar_altura, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self.avatar.setPixmap(pixmap)
        self.timer_boca.start(tempo_aberta if self.boca_aberta else tempo_fechada)
    
    def parar_boca(self):
        self.animando = False
        self.timer_boca.stop()
        pixmap_fechada = self.img_fechada.scaled(avatar_largura, avatar_altura, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self.avatar.setPixmap(pixmap_fechada)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    janela = MetaDayApp()
    janela.resize(600, 400)
    janela.show()
    sys.exit(app.exec_())