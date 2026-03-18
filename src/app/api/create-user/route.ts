import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, department, reporting_officer, joining_date } = await req.json();

    // Use the Service Role Key (Admin privileges)
    // This must be stored in your environment variables
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // 1. Create user in Supabase Auth (Auto-confirm email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, role: role }
    });

    if (authError) throw authError;

    // 2. Insert user record into public.users table
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      name,
      email,
      role,
      department,
      reporting_officer: reporting_officer || null,
      joining_date,
      status: "active",
    });

    if (dbError) throw dbError;

    return NextResponse.json({ message: "User created successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
