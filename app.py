from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import os
from ping3 import ping
import ipaddress

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:////app/data/devices.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    ip = db.Column(db.String(15), nullable=False)
    mac = db.Column(db.String(17), nullable=False)
    broadcast = db.Column(db.String(15), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, include_created_at=True):
        data = {
            'id': self.id,
            'name': self.name,
            'ip': self.ip,
            'mac': self.mac,
            'broadcast': self.broadcast
        }
        if include_created_at:
            data['created_at'] = self.created_at.isoformat()
        return data

def calculate_broadcast(ip):
    """计算广播地址（假设子网掩码为255.255.255.0）"""
    try:
        # 将IP地址转换为网络对象
        ip_interface = ipaddress.IPv4Interface(f"{ip}/24")
        # 获取网络的广播地址
        return str(ip_interface.network.broadcast_address)
    except ValueError:
        # 如果IP地址无效，返回None
        return None

def send_wol(ip, mac, broadcast=None):
    """发送Wake-on-LAN魔术包"""
    try:
        # 格式化MAC地址
        mac = mac.replace(":", "").replace("-", "")
        if len(mac) != 12:
            raise ValueError("Invalid MAC address format")
        
        # 构建魔术包
        magic_packet = b'\xFF' * 6 + bytes.fromhex(mac) * 16
        
        # 发送数据包
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        # 使用提供的广播地址，如果没有则计算
        if not broadcast:
            broadcast = calculate_broadcast(ip)
        sock.sendto(magic_packet, (broadcast, 9))
        sock.close()
        return True
    except Exception as e:
        print(f"Error sending WOL packet: {str(e)}")
        return False

def check_device_status(ip):
    """检查设备在线状态"""
    try:
        response_time = ping(ip, timeout=1)
        return response_time is not None
    except Exception:
        return False

@app.route('/')
def redirect_to_default_language():
    return redirect('/en/')

@app.route('/<lang>/')
def index(lang='en'):
    with open('languages.json', 'r', encoding='utf-8') as f:
        languages = json.load(f)
    devices = Device.query.all()
    # 确保lang是有效的语言代码
    if lang not in languages:
        return redirect('/en/')
    return render_template('index.html', devices=devices, language=languages[lang], lang=lang)

@app.route('/api/devices', methods=['GET'])
def get_devices():
    devices = Device.query.all()
    return jsonify([device.to_dict() for device in devices])

@app.route('/api/devices', methods=['POST'])
def add_device():
    data = request.json
    # 计算广播地址
    broadcast = data.get('broadcast') or calculate_broadcast(data['ip'])
    if not broadcast:
        return jsonify({'error': '无效的IP地址'}), 400
    
    device = Device(
        name=data['name'],
        ip=data['ip'],
        mac=data['mac'],
        broadcast=broadcast
    )
    db.session.add(device)
    db.session.commit()
    return jsonify(device.to_dict()), 201

@app.route('/api/devices/<int:device_id>', methods=['PUT'])
def update_device(device_id):
    device = Device.query.get_or_404(device_id)
    data = request.json
    device.name = data.get('name', device.name)
    device.ip = data.get('ip', device.ip)
    device.mac = data.get('mac', device.mac)
    # 更新广播地址
    if 'broadcast' in data:
        device.broadcast = data['broadcast']
    elif 'ip' in data:
        device.broadcast = calculate_broadcast(data['ip'])
    db.session.commit()
    return jsonify(device.to_dict())

@app.route('/api/devices/<int:device_id>', methods=['DELETE'])
def delete_device(device_id):
    device = Device.query.get_or_404(device_id)
    db.session.delete(device)
    db.session.commit()
    return '', 204

@app.route('/api/devices/<int:device_id>/wake', methods=['POST'])
def wake_device(device_id):
    device = Device.query.get_or_404(device_id)
    success = send_wol(device.ip, device.mac, device.broadcast)
    return jsonify({'success': success})

@app.route('/api/devices/<int:device_id>/status', methods=['GET'])
def device_status(device_id):
    device = Device.query.get_or_404(device_id)
    status = check_device_status(device.ip)
    return jsonify({'online': status})

def validate_device_json(data):
    """验证导入的JSON数据结构"""
    required_fields = ['name', 'ip', 'mac', 'broadcast']
    if not isinstance(data, list):
        return False, "JSON数据应该是一个数组"
    
    for device in data:
        if not all(field in device for field in required_fields):
            return False, f"每个设备必须包含以下字段: {', '.join(required_fields)}"
        
        # 验证MAC地址格式
        if len(device['mac'].replace(':', '').replace('-', '')) != 12:
            return False, "MAC地址格式不正确"
        
        # 验证IP地址格式
        try:
            ipaddress.IPv4Address(device['ip'])
        except ipaddress.AddressValueError:
            return False, "IP地址格式不正确"
    
    return True, None

@app.route('/api/devices/export', methods=['GET'])
def export_devices():
    devices = Device.query.all()
    # 去掉id字段
    devices_data = [{
        'name': device.name,
        'ip': device.ip,
        'mac': device.mac,
        'broadcast': device.broadcast
    } for device in devices]
    
    # 添加日期时间后缀
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'devices_export_{timestamp}.json'  # 导出的JSON名称后添加日期和时间后缀
    
    response = jsonify(devices_data)
    response.headers['Content-Disposition'] = f'attachment; filename={filename}'
    return response

@app.route('/api/devices/import', methods=['POST'])
def import_devices():
    if 'file' not in request.files:
        return jsonify({'error': '未提供文件'}), 400
    
    file = request.files['file']
    try:
        data = json.load(file)
    except json.JSONDecodeError:
        return jsonify({'error': '文件不是有效的JSON格式'}), 400
    
    # 验证JSON结构
    is_valid, error_message = validate_device_json(data)
    if not is_valid:
        return jsonify({'error': error_message}), 400
    
    # 处理导入
    imported_count = 0
    for device_data in data:
        # 检查是否已存在相同IP和MAC的设备
        existing_device = Device.query.filter_by(
            ip=device_data['ip'],
            mac=device_data['mac']
        ).first()
        
        if not existing_device:
            new_device = Device(
                name=device_data['name'],
                ip=device_data['ip'],
                mac=device_data['mac'],
                broadcast=device_data['broadcast']
            )
            db.session.add(new_device)
            imported_count += 1
    
    db.session.commit()
    return jsonify({
        'message': f'成功导入{imported_count}个设备',
        'imported_count': imported_count
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
