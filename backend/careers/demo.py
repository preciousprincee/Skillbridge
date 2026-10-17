"""Built-in demonstration scenarios. NOT live vacancies; no employer is involved.
Sample submissions are hand-written examples so a presenter can demo the assessment step without typing."""

DEMO_LABEL = "Demonstration data. This is a sample job description, not a live vacancy."

DEMO_SCENARIOS = [
    {
        "id": "data-engineer",
        "title": "Junior Data Engineer",
        "profile": {
            "name": "Demo Student",
            "target_role": "Junior Data Engineer",
            "experience_level": "Beginner",
            "existing_skills": ["Basic Python", "Basic SQL", "Spreadsheets"],
            "weekly_learning_hours": 10,
        },
        "job_description": """Junior Data Engineer (SAMPLE - demonstration data, not a real vacancy)

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
""",
        "sample_submission": """Project summary: I built a small ETL pipeline for a 5,000-row sample sales CSV.

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
branches (single commit).""",
    },
    {
        "id": "digital-marketing",
        "title": "Digital Marketing Assistant",
        "profile": {
            "name": "Demo Student",
            "target_role": "Digital Marketing Assistant",
            "experience_level": "Beginner",
            "existing_skills": ["Social media posting", "Canva (basic)", "Writing captions"],
            "weekly_learning_hours": 8,
        },
        "job_description": """Digital Marketing Assistant (SAMPLE - demonstration data, not a real vacancy)

A growing small business is looking for a digital marketing assistant to support its online presence.

Requirements:
- Write clear, engaging content for Instagram, Facebook and WhatsApp Business
- Plan and schedule a monthly social media content calendar
- Create simple graphics using tools such as Canva
- Report on post performance using the platforms' built-in analytics
- Basic understanding of SEO and email newsletters is a plus
- Good communication skills and the ability to take feedback from the business owner

Responsibilities:
- Post and monitor content on social media accounts
- Respond to customer comments and messages
- Send a short weekly performance summary to the owner
""",
        "sample_submission": """Project summary: I created a 4-week social media plan for a fictional Lagos bakery, "Sweet Crumbs" (an invented business).

Strategy: the goal was more weekend cake orders through WhatsApp. Audience: office workers and event planners in Lagos.
I chose three content pillars: behind-the-scenes baking, customer celebrations, and weekly offers.

Content calendar: 4 weeks, 4 posts a week on Instagram and Facebook. Each entry lists the date, pillar, caption draft,
graphic idea and a call to action ("Order on WhatsApp by Thursday"). I made 6 graphics in Canva using one colour palette
and one font set so the page looks consistent.

Sample caption: "Birthday on Saturday? Fresh vanilla cake, delivered. Message us on WhatsApp by Thursday."

Measurement: I planned to track reach, saves and WhatsApp enquiries each week in a simple table and send the owner a
5-line summary every Friday. I have not run the campaign on a real account, so the numbers are placeholders.

Reflection: next time I would test two posting times and ask customers how they found the bakery. I did not cover SEO or email.""",
    },
    {
        "id": "junior-accountant",
        "title": "Junior Accountant",
        "profile": {
            "name": "Demo Student",
            "target_role": "Junior Accountant",
            "experience_level": "Recent graduate",
            "existing_skills": ["Excel (basic)", "Bookkeeping basics", "QuickBooks (beginner)"],
            "weekly_learning_hours": 6,
        },
        "job_description": """Junior Accountant (SAMPLE - demonstration data, not a real vacancy)

A retail company is hiring a junior accountant to support the finance team.

Requirements:
- Record daily transactions accurately in accounting software
- Reconcile bank statements with the cash book
- Prepare a trial balance and support month-end close
- Strong Excel skills, including formulas, lookups and pivot tables
- Basic awareness of VAT and other business taxes
- High attention to detail and clear written communication

Responsibilities:
- Process invoices and payments
- Prepare monthly reconciliations
- Flag differences and explain them to the finance manager
""",
        "sample_submission": """Project summary: I completed a one-month bank reconciliation and trial balance for a fictional retail shop (invented data).

Method: I entered 60 transactions into an Excel cash book, then compared them with a sample bank statement using a
lookup formula on the reference number. I found 4 differences: 2 deposits in transit, 1 unpresented cheque, and 1 bank
charge missing from the cash book. I posted an adjusting entry for the bank charge.

Result: adjusted cash book balance and bank balance both came to the same figure after the reconciling items.
I then built a trial balance with a check cell that confirms total debits equal total credits.

Documentation: a "Notes" sheet explains each reconciling item in one sentence and what action is needed.

Limits: I did not cover VAT, and the data was small. Next I would add a pivot table of expenses by category and
write a short memo to the finance manager summarising the differences.""",
    },
]

SCENARIO_IDS = {s["id"] for s in DEMO_SCENARIOS}
