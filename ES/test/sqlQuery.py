import mysql.connector

def fetch_job_data():
    db_config = {
        "host": "localhost",
        "port": 3306,
        "user": "root",
        "password": "root",
        "database": "goodjob",
        "charset": "utf8mb4"
    }

    query = """
    SELECT id, company_name, department, experience, job_type, requirements, preferred_qualifications FROM jobs;
    """

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        results = cursor.fetchall()

        formatted_texts = []
        
        for row in results:
            formatted_text = f'''
"company_name": "{row['company_name']}"
"department": "{row['department']}"
"experience": "{row['experience']}"
"job_type": "{row['job_type']}"
"requirements": "{row['requirements']}"
"preferred_qualifications": "{row['preferred_qualifications']}"
            '''.strip()
            formatted_texts.append(formatted_text)

        return formatted_texts

    except mysql.connector.Error as err:
        print(f"MySQL 오류 발생: {err}")
        return []

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()