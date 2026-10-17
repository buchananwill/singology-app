import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import { createAdminDbFromEnv } from "../src/adminDbFromEnv";
import { coaches, profiles, students } from "../src/schema";

const db = createAdminDbFromEnv();
try {
  for (const email of process.argv.slice(2)) {
    const users = await db
      .select({ id: authUsers.id, email: authUsers.email })
      .from(authUsers)
      .where(eq(authUsers.email, email));
    for (const user of users) {
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id));
      const [coach] = await db.select().from(coaches).where(eq(coaches.userId, user.id));
      const [student] = await db.select().from(students).where(eq(students.userId, user.id));
      console.log(
        `${email}: user ${user.id} profile=${profile?.displayName ?? "none"} coach=${coach ? `${coach.tier}, active=${coach.active}` : "none"} student=${student ? student.voiceType : "none"}`,
      );
    }
    if (users.length === 0) {
      console.log(`${email}: no auth user`);
    }
  }
} finally {
  await db.$client.end();
}
