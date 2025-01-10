#!/bin/sh

# 初始化数据库
python3 -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Database tables created successfully!')
"

# 启动 Gunicorn
exec gunicorn --bind 0.0.0.0:${PORT} --workers 4 app:app
