// TODO: make sure this doesn't mess other things up
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
// import { NextResponse } from 'next/server';

// import type { Database } from '@/database.types';

// export async function POST(request: Request) {
//   const requestUrl = new URL(request.url);
//   const cookieStore = cookies();
//   const supabase = createRouteHandlerClient<Database>({
//     cookies: () => cookieStore,
//   });

//   await supabase.auth.signOut();

//   return NextResponse.redirect(requestUrl.origin, {
//     status: 301,
//   });
// }
