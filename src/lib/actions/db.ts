import postgres from 'postgres';

const sql = postgres({
  host: 'aws-0-ca-central-1.pooler.supabase.com',
  database: 'postgres',
  port: 5432,
  user: 'postgres.yhicazhgeuiszmdmcmoz',
  password: '3or#S!#UKGK74s',
});

export default sql;
