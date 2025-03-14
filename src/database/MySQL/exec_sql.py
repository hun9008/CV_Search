import mysql.connector

db_config = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "root",
    "database": "goodjob"
}

sql_file = "jobs_dummy.sql"

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    with open(sql_file, "r", encoding="utf-8") as file:
        sql_commands = file.read()

    for statement in sql_commands.split(";"):
        if statement.strip():
            cursor.execute(statement)

    conn.commit()

except mysql.connector.Error as err:
    print(f"MySQL 오류 발생: {err}")

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()