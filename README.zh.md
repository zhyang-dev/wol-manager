# Wake On LAN 管理器
[English](README.md)

这是一个基于Flask的Web应用程序，用于管理和监控局域网内支持Wake-on-LAN功能的设备。

## 功能特点

- 添加和管理网络设备
- 发送Wake-on-LAN魔术包唤醒设备
- 实时监控设备在线状态
- 编辑设备信息
- 删除设备
- 美观的响应式Web界面
- SQLite数据库存储设备信息

## 技术栈

- 后端：Flask + SQLAlchemy
- 前端：Bootstrap 5 + SweetAlert2
- 数据库：SQLite
- 容器化：Docker + Docker Compose

## 安装说明

1. 创建虚拟环境（可选）：
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 运行应用：
```bash
python app.py
```

4. 访问应用：
打开浏览器访问 http://localhost:8088

## Docker部署

1. 使用Docker Compose启动应用：
```bash
docker-compose up -d
```

2. 查看日志：
```bash
docker-compose logs -f
```

3. 停止应用：
```bash
docker-compose down
```

### Docker注意事项

- 应用使用host网络模式运行，这对于Wake-on-LAN功能是必需的
- 数据库文件存储在./data目录中
- 容器自动重启（除非手动停止）
- 使用gunicorn作为生产环境服务器
- 默认端口：8088

## 使用说明

1. 添加设备：
   - 点击"添加设备"按钮
   - 在弹出的表单中填写设备信息
   - 点击"保存"按钮

2. 管理设备：
   - 唤醒设备：点击"唤醒设备"按钮
   - 检查状态：点击"刷新状态"按钮
   - 编辑信息：点击"编辑信息"按钮
   - 删除设备：点击"删除条目"按钮（需要确认）

## 注意事项

- 确保目标设备已正确配置Wake-on-LAN功能
- 确保在同一局域网内操作
- MAC地址格式：XX:XX:XX:XX:XX:XX 或 XX-XX-XX-XX-XX-XX
- IP地址必须是有效的IPv4地址
- 广播地址会根据IP地址自动计算（默认子网掩码：255.255.255.0）。目前发送数据包的目标地址是ip，因此广播地址暂时没有用到。
