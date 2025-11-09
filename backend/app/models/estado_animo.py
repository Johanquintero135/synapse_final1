from datetime import date
from . import db
from ..utils import generate_uuid

class EstadoAnimo(db.Model):
    __tablename__ = 'estado_animo'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    usuario_id = db.Column(db.String(36), db.ForeignKey('usuario.id_usuario'), nullable=False)
    fecha = db.Column(db.Date, default=date.today, nullable=False)
    valor = db.Column(db.Integer, nullable=False)  # 1=Excelente,2=Bien,3=Regular,4=Bajo
    nota = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'fecha': self.fecha.isoformat(),
            'valor': self.valor,
            'nota': self.nota
        }
