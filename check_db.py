import psycopg2
try:
    conn = psycopg2.connect(dbname="civicpulse_db", user="postgres", password="civic@12", host="localhost", port="5432")
    cur = conn.cursor()
    cur.execute("SELECT application_number, department FROM service_applications;")
    rows = cur.fetchall()
    print("TOTAL ROWS:", len(rows))
    for row in rows:
        print(row)
    cur.close()
    conn.close()
except Exception as e:
    print(e)
