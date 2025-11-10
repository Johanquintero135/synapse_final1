from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from ..models import db, Usuario, Rol
from ..utils.validators import validate_email, validate_password
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        # Aceptar JSON o form-data (por seguridad, si el cliente envía form-encoded)
        data = request.get_json(silent=True) or request.form.to_dict() or {}

        # Validar campos requeridos
        if not data.get('username') or not (data.get('correo') or data.get('email')) or not data.get('password'):
            return jsonify({'error': 'Username, email y contraseña son requeridos'}), 400

        # Validar formato de email (aceptar llave 'email' también)
        correo_val = data.get('correo') or data.get('email')
        email_valid, email_msg = validate_email(correo_val)
        if not email_valid:
            return jsonify({'error': email_msg}), 400
        
        # Validar fortaleza de contraseña
        password_valid, password_msg = validate_password(data['password'])
        if not password_valid:
            return jsonify({'error': password_msg}), 400
        
        # Verificar si el email ya existe
        if Usuario.query.filter_by(correo=correo_val).first():
            return jsonify({'error': 'El email ya está registrado'}), 400

        # Verificar si el username ya existe
        if Usuario.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'El username ya está registrado'}), 400

        # Obtener rol por defecto (usuario)
        rol_usuario = Rol.query.filter_by(nombre='usuario').first()
        # Si el rol por defecto no existe, crearlo automáticamente para evitar errores 500 en registro
        if not rol_usuario:
            rol_usuario = Rol(nombre='usuario')
            db.session.add(rol_usuario)
            db.session.commit()

        # Crear nuevo usuario
        nuevo_usuario = Usuario(
            username=data['username'],
            correo=correo_val,
            password=generate_password_hash(data['password']),
            rol_id=rol_usuario.id
        )

        db.session.add(nuevo_usuario)
        db.session.commit()

        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'usuario': nuevo_usuario.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        # Aceptar JSON o form-data
        data = request.get_json(silent=True) or request.form.to_dict() or {}

        # Validar datos requeridos (aceptar 'correo' o 'email' o 'username')
        if not (data.get('correo') or data.get('email') or data.get('username')) or not data.get('password'):
            return jsonify({'error': 'Email/username y contraseña son requeridos'}), 400

        # Buscar usuario por correo o por username
        correo_val = data.get('correo') or data.get('email')
        if correo_val:
            usuario = Usuario.query.filter_by(correo=correo_val).first()
        else:
            usuario = Usuario.query.filter_by(username=data.get('username')).first()
        
        if not usuario or not check_password_hash(usuario.password, data['password']):
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        if not usuario.activo:
            return jsonify({'error': 'Cuenta desactivada'}), 401
        
        # Actualizar último acceso
        usuario.ultimo_acceso = datetime.utcnow()
        db.session.commit()
        
        # Crear token JWT
        access_token = create_access_token(identity=usuario.id_usuario)
        
        return jsonify({
            'access_token': access_token,
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)
        
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        return jsonify(usuario.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Contraseña actual y nueva son requeridas'}), 400
        
        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Verificar contraseña actual
        if not check_password_hash(usuario.password, data['current_password']):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 400
        
        # Actualizar contraseña
        usuario.password = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Contraseña actualizada exitosamente'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500