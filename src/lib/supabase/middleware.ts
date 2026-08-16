import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables.");
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach((cookie) => {
            request.cookies.set(cookie.name, cookie.value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach((cookie) => {
            response.cookies.set(
              cookie.name,
              cookie.value,
              cookie.options
            );
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
