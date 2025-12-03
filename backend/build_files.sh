#!/usr/bin/env bash
pip install -r requirements.txt

echo "Migrando banco de dados..."
python3 manage.py migrate --noinput
