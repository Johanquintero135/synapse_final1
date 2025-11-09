from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, EstadoAnimo
from datetime import datetime, date, timedelta

estado_bp = Blueprint('estado_animo', __name__)

@estado_bp.route('', methods=['POST'])
@jwt_required()
def record_estado():
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json() or {}
        valor = data.get('valor')
        nota = data.get('nota')
        fecha_str = data.get('fecha')

        if valor is None:
            return jsonify({'error': 'Campo "valor" requerido (1-4)'}), 400
        try:
            valor = int(valor)
            if valor < 1 or valor > 4:
                raise ValueError()
        except Exception:
            return jsonify({'error': 'Valor inválido, debe ser entero entre 1 y 4'}), 400

        if fecha_str:
            try:
                fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except Exception:
                return jsonify({'error': 'Formato de fecha inválido (YYYY-MM-DD)'}), 400
        else:
            fecha = date.today()

        ea = EstadoAnimo(usuario_id=usuario_id, valor=valor, nota=nota, fecha=fecha)
        db.session.add(ea)
        db.session.commit()
        return jsonify(ea.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@estado_bp.route('/history', methods=['GET'])
@jwt_required()
def history():
    try:
        usuario_id = get_jwt_identity()
        days = int(request.args.get('days', 14))
        end_date = date.today()
        start_date = end_date - timedelta(days=days-1)

        # Query por rango de fechas
        rows = EstadoAnimo.query.filter(
            EstadoAnimo.usuario_id == usuario_id,
            EstadoAnimo.fecha >= start_date,
            EstadoAnimo.fecha <= end_date
        ).all()

        # Agrupar por fecha
        by_date = {}
        for r in rows:
            key = r.fecha.isoformat()
            if key not in by_date:
                by_date[key] = {'count':0, 'sum':0, 'breakdown':{1:0,2:0,3:0,4:0}}
            by_date[key]['count'] += 1
            by_date[key]['sum'] += r.valor
            by_date[key]['breakdown'][r.valor] = by_date[key]['breakdown'].get(r.valor,0) + 1

        # Construir lista ordenada por fecha, rellenar fechas sin datos con nulls
        result = []
        current = start_date
        while current <= end_date:
            k = current.isoformat()
            if k in by_date:
                entry = by_date[k]
                avg = entry['sum'] / entry['count'] if entry['count']>0 else None
                result.append({'date':k, 'avg': round(avg,2) if avg is not None else None, 'count': entry['count'], 'breakdown': entry['breakdown']})
            else:
                result.append({'date':k, 'avg': None, 'count': 0, 'breakdown': {1:0,2:0,3:0,4:0}})
            current = current + timedelta(days=1)

        return jsonify({'history': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
