import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const getUserByUsername = async (username: string) => {
  try {
    const [rows] = await db.query<any[]>(
      "SELECT username, password, role FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (!rows || rows.length === 0) return null;

    const user = rows[0];

    if (!user.username || !user.password || !user.role) {
      console.warn("Incomplete user data for username:", username);
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role as "ketua" | "member",
      createdAt: user.created_at ?? null,
    };

  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    return null;
  }
};

export default db;