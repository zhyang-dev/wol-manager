# 使用Python 3.10作为基础镜像
FROM python:3.10-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    FLASK_ENV=production \
    PORT=8088

# 复制所有项目文件
COPY . .

# 安装Python依赖并创建数据目录
RUN mkdir /data && \
    pip install --no-cache-dir -r requirements.txt && \
    pip uninstall -y pip && \
    chmod +x start.sh

# 暴露端口
EXPOSE ${PORT}

# 启动命令
CMD ["./start.sh"]
