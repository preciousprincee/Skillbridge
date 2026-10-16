"""Built-in demonstration scenario. NOT a live vacancy; no employer is involved."""

DEMO_LABEL = "Demonstration data. This is a sample job description, not a live vacancy."

DEMO_PROFILE = {
    "name": "Demo Student",
    "target_role": "Junior Data Engineer",
    "experience_level": "Beginner",
    "existing_skills": ["Basic Python", "Basic SQL", "Spreadsheets"],
    "weekly_learning_hours": 10,
    "is_demo": True,
}

DEMO_JOB_DESCRIPTION = """Junior Data Engineer (SAMPLE - demonstration data, not a real vacancy)

We are looking for a junior data engineer to help build and maintain small data pipelines.

Requirements:
- Working knowledge of Python for data processing
- Good SQL skills and an understanding of relational databases such as PostgreSQL
- Experience cleaning and validating messy data
- Understanding of ETL fundamentals (extract, transform, load)
- Familiarity with version control using Git
- Basic awareness of cloud platforms is a plus
- Clear written communication and the ability to document your work

Responsibilities:
- Build and monitor simple ETL pipelines
- Write SQL queries to answer business questions
- Document data flows for the team
"""

# Hand-written example so the presenter can demo the assessment step without typing.
DEMO_SUBMISSION = """Project summary: I built a small ETL pipeline for a 5,000-row sample sales CSV.

Extract: a Python script (etl.py) reads sales.csv with pandas and logs the row count.

Transform: I dropped exact duplicate rows, filled missing 'region' values with 'Unknown', converted order_date to
a proper date type, standardised inconsistent country names (e.g. 'nigeria', 'NIGERIA ' -> 'Nigeria'), and removed rows
with negative quantities. I wrote 3 assert checks (no null order_id, quantity > 0, dates parse).

Load: the cleaned data is loaded into a PostgreSQL table 'sales_clean' using psycopg2 with a primary key on order_id.

SQL: I wrote queries for (1) total revenue per month, (2) top 5 products by revenue, (3) revenue by region. Example:
SELECT date_trunc('month', order_date) AS month, SUM(quantity * unit_price) AS revenue
FROM sales_clean GROUP BY 1 ORDER BY 1;

Documentation: the README explains how to run the pipeline, the table schema and the cleaning rules.

Production improvements: I would schedule it with cron or Airflow, add incremental loads, put credentials in environment
variables, and add alerting on failed runs. I have not set up automated tests beyond the asserts, and I did not use Git
branches (single commit)."""
