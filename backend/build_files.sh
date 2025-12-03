#!/usr/bin/env bash

echo "Instalando dependências..."
pip install -r requirements.txt

echo "Coletando arquivos estáticos..."
python3 manage.py collectstatic --noinput
